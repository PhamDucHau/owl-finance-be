import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import axios from "axios";
import { FriendGateway } from './socket/friend.gateway';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>,
    private readonly friendGateway: FriendGateway,
    private jwtService: JwtService,) { }
  async createUserWithFirebase(data: { uid: string; email: string; name: string }) {
    // Kiểm tra xem user đã tồn tại trong MongoDB

    let user = await this.userModel.findOne({ uid: data.uid });
    if (!user) {

      // Nếu chưa tồn tại, tạo user mới
      user = new this.userModel({
        uid: data.uid,
        email: data.email,
        name: data.name,
      });

      // Lưu user mới vào database
      await user.save();
    }

    const payload = { uid: user.uid, email: user.email };
    const token = await this.generateUserTokens(payload);
    return { user, token };
  }

  async login(email: string, password: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        // throw new Error('User not found');
        throw new UnauthorizedException('Login failed');
      }

      if (user.password !== password) {
        // throw new Error('Invalid password');
        throw new UnauthorizedException('Login failed');
      }


      const payload = { uid: user.uid, email: user.email };
      const token = await this.generateUserTokens(payload);

      return { user, token };
    } catch (error) {
      // throw new Error('Login failed');
      throw new UnauthorizedException('Login failed');

    }
  }

  async createUserWithForm(data: { name: string; email: string; password: string }) {
    // Kiểm tra xem email đã được sử dụng chưa
    try {
      const existingUser = await this.userModel.findOne({ email: data.email });
      if (existingUser) {
        // throw new Error('Email is already in use');
        throw new UnauthorizedException('Email is already in use');
      }

      // Tạo user mới
      const newUser = new this.userModel(data);
      return newUser.save();
    } catch (error) {
      throw new UnauthorizedException('Email already in use');
    }
  }

  async generateUserTokens(payload) {
    const accessToken = this.jwtService.sign({ payload }, {
      expiresIn: '1h'
    });
    return { accessToken }
  }

  async getDataByIdUser(email: string) {
    console.log('email', email);
    return this.userModel.findOne({ email }).exec()
  }

  async createDataByIdUser(email: string, data: any) {
    const result = await this.userModel.updateOne({ email }, { $push: { data_card: data } }).exec()
    return result
  }

  async updateDataByIdUser(email: string, data: any) {
    const updateFields = Object.keys(data).reduce((acc, key) => {
      if (key !== '_id') {
        acc[`data_card.$.${key}`] = data[key];
      }
      return acc;
    }, {} as Record<string, any>);

    const result = await this.userModel.findOneAndUpdate(
      { email, 'data_card._id': data.id },
      { $set: updateFields }, // Cập nhật từng trường cụ thể
      { new: true } // Trả về dữ liệu sau khi cập nhật
    ).exec();
    this.sendMessage(data);

    return result;
  }

  async createTransactionsByIdUser(email: string, data: any) {

    const body = {
      ...data,
      deleted: false
    }
    const user = await this.userModel.findOne({ email, 'data_card._id': new mongoose.Types.ObjectId(data.cardId) });
    const dataCard = user.data_card.find((card: any) => card._id.toString() === data.cardId);
    console.log('user', user);
    console.log('dataCard', dataCard);
    delete body.cardId
    console.log('body', body);
    const result = await this.userModel.updateOne(
      { email, 'data_card._id': new mongoose.Types.ObjectId(data.cardId) },
      { $push: { 'data_card.$.transactions': body } }, // Cập nhật transactions trong đúng thẻ
      { new: true } // Trả về dữ liệu mới nhất sau khi update
    ).exec();
    console.log('result', result);
    const message = `
    📢 *Giao dịch mới được thêm vào thẻ!*
    📧*Email:* \`${email}\` 
    💳 *Số thẻ:* \`${dataCard.card_number}\`
    🏦 *Tên ngân hàng:* \`${dataCard.bank_name}\`
    📌 *Danh mục:* \`${data.category}\`
    🍽 *Sản phẩm:* \`${data.product}\`
    💰 *Tiền:* \`${Number(data.money).toLocaleString()}\`
    📦 *Số lượng:* \`${data.quantity}\`
    🧾 *Tổng cộng:* \`${Number(data.total).toLocaleString()}\`
    
     
        `;
    this.sendMessage(message);
    return result
  }

  async deleteDataByIdUser(email: string, data: any) {
    const body = {
      ...data,
      deleted: true
    }
    console.log('body', body);
    const result = await this.userModel.findOneAndUpdate(
      { email, 'data_card._id': data._id },
      { $set: { 'data_card.$.deleted': true } }, // Giữ nguyên _id cũ
      { new: true } // Trả về dữ liệu sau khi cập nhật
    ).exec();
    console.log('result', result);

    return result

  }

  async deleteTransactionsByIdUser(email: string, data: any) {

    const result = await this.userModel.updateOne(
      {
        email,
        'data_card._id': new mongoose.Types.ObjectId(data.cardId),
        'data_card.transactions._id': new mongoose.Types.ObjectId(data._id)
      },
      {
        $set: { 'data_card.$[].transactions.$[transaction].deleted': true }
      },
      {
        arrayFilters: [{ 'transaction._id': new mongoose.Types.ObjectId(data._id) }], // Chỉ cập nhật đúng transaction cần xóa
        new: true
      }
    ).exec();

    console.log('result', result);
    return result;
  }

  async updateTransactionByIdUser(email: string, data: any) {
    const { id, cardId, ...updateFields } = data; // Tách riêng ID để tránh lỗi ghi đè

    const result = await this.userModel.findOneAndUpdate(
      {
        email,
        'data_card._id': cardId,
        'data_card.transactions._id': id
      },
      {
        $set: Object.keys(updateFields).reduce((acc, key) => {
          acc[`data_card.$.transactions.$[transaction].${key}`] = updateFields[key];
          return acc;
        }, {} as Record<string, any>)
      },
      {
        arrayFilters: [{ 'transaction._id': id }], // Chỉ update transaction có ID tương ứng
        new: true // Trả về dữ liệu sau khi cập nhật
      }
    ).exec();

    return result;
  }



  private readonly botToken = '7561500069:AAGNyOQMfdTZnkic5S1AfLSMUT30qCVU_bA';
  private readonly chatId = '-4711661610';

  async sendMessage(message: any): Promise<void> {
    console.log('✅ message', message);
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

    try {
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'Markdown',
      });
      console.log('✅ Tin nhắn đã được gửi thành công!');
    } catch (error) {
      console.error('❌ Lỗi gửi tin nhắn:', error.response?.data || error.message);
    }
  }

  async sendImage(message: any): Promise<void> {
    const url = `https://api.telegram.org/bot${this.botToken}/sendPhoto`;
    console.log('✅ message', message);

    try {
      await axios.post(url, {
        chat_id: this.chatId,
        photo: message,
        parse_mode: 'Markdown',
      });
      console.log('✅ Hình ảnh đã được gửi thành công!');
    } catch (error) {
      console.error('❌ Lỗi gửi hình ảnh:', error.response?.data || error.message);
    }
  }

  async sendMessageAI(body: any): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer sk-fc52ed1b46334bd8935848d378f4cad9`
    };
    const url = `https://api.deepseek.com/v1/chat/completions`;
    console.log('✅ message', body);

    try {
      const response = await axios.post(url, {
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: body
        }],
      }, { headers });
      console.log('✅ Tin nhắn đã được gửi thành công!');
      return response.data;
    } catch (error) {
      console.error('❌ Lỗi gửi tin nhắn:', error.response?.data || error.message);
      throw error;
    }
  }


  async sendFriendRequest(email: string, recipient: string) {
    const user = await this.userModel.findOne({ email });
    const recipientUser = await this.userModel.findOne({ email: recipient });
    if (!user || !recipientUser) {
      throw new UnauthorizedException('User not found');
    }
    await this.userModel.findOneAndUpdate({ email }, { $push: { friendships: { recipient: recipientUser._id, recipient_gmail: recipientUser.email, status: 'sent' } } }).exec();
    await this.userModel.findOneAndUpdate({ email: recipient }, { $push: { friendships: { recipient: user._id, recipient_gmail: email, status: 'pending' } } }).exec();
    return { success: true };
  }

  async acceptFriendRequest(email: string, recipient: string) {
    const user = await this.userModel.findOne({ email });
    const recipientUser = await this.userModel.findOne({ email: recipient });

    if (!user || !recipientUser) {
      throw new UnauthorizedException('User not found');
    }

    await this.userModel.updateOne(
      { email, "friendships.recipient_gmail": recipient },
      { $set: { "friendships.$.status": "accepted" } }
    ).exec();

    await this.userModel.updateOne(
      { email: recipient, "friendships.recipient_gmail": email },
      { $set: { "friendships.$.status": "accepted" } }
    ).exec();
    return { success: true };
  }

  async rejectFriendRequest(email: string, recipient: string) {
    const user = await this.userModel.findOne({ email });
    const recipientUser = await this.userModel.findOne({ email: recipient });


    await this.userModel.updateOne(
      { email: email },
      { $pull: { friendships: { recipient_gmail: recipient } } }
    ).exec();

    await this.userModel.updateOne(
      { email: recipient },
      { $pull: { friendships: { recipient_gmail: email } } }
    ).exec();

    return { success: true };
  }



  async getFriendsNotAccepted(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Lọc ra danh sách bạn bè đã accepted
    const acceptedFriends = user.friendships.filter(
      (friend) => friend.status !== 'accepted'
    );

    return acceptedFriends;
  }

  async getFriendsAccepted(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Lọc ra danh sách bạn bè đã accepted
    const acceptedFriends = user.friendships.filter(
      (friend) => friend.status === 'accepted'
    );

    for (let i = 0; i < acceptedFriends.length; i++) {

      const user = await this.userModel.findOne({ email: acceptedFriends[i].recipient_gmail });
      console.log('user', user);
      let total = 0;
      user.data_card.forEach((card: any) => {
        console.log('card', card);
        card.transactions.forEach((transaction: any) => {
          console.log('transaction', transaction);
          total += Number(transaction.money);
        });
      });
      console.log('total', total);
      acceptedFriends[i].total = total;
    }
    return acceptedFriends;
  }

  async getAllEmail(email: string) {
    const friendships = await this.userModel.findOne({ email });
    const allEmail = await this.userModel.find({ email: { $ne: email } }).select('email').exec();
    const allEmailNotFriend = allEmail.filter((user) => !friendships?.friendships.some((friend) => friend.recipient_gmail === user.email));


    return allEmailNotFriend;
  }

  async sendRequestSocket(senderEmail: string, recipientEmail: string, message: string) {
    // ... logic lưu DB

    // Gửi socket cho người nhận
    this.friendGateway.sendFriendRequest(recipientEmail, {
      from: senderEmail,
      message: message,
    });
  }

  async createPlan(email: string, body: any) {
    console.log('body', body);
    const result = await this.userModel.findOneAndUpdate(
      { email },
      { $push: { plan: body } },
      { new: true }
    ).exec();

    if (!result) {
      throw new UnauthorizedException('User not found');
    }

    return { success: true };
  }

  async updatePlan(email: string, body: any) {
    const result = await this.userModel.findOneAndUpdate(
      { email, 'plan._id': body._id },
      { $set: { 'plan.$.status': body.status } },
      { new: true }
    ).exec();
    return result;
  }

  async deletePlan(email: string, body: any) {
    const result = await this.userModel.findOneAndUpdate(
      { email, 'plan._id': body._id },
      { $pull: { plan: { _id: body._id } } },
      { new: true }
    ).exec();
    return result;
  }

  async getAllPlan(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user.plan;
  }

  async connectAI(email: string, body: any) {
    try {
      const testMessage = body.message;
      const response = await this.sendMessageAI(testMessage);
      
      if (response && response.choices && response.choices[0]) {
        return {
          success: true,
          message: "Successfully connected to Deepseek AI",
          response: response.choices[0].message
        };
      } else {
        throw new Error("Invalid response format from AI");
      }
    } catch (error) {
      console.error('❌ Lỗi kết nối AI:', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to connect to AI service');
    }
  }


}
