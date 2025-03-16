import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import axios from "axios";

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>,
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

    return result;
}

  async createTransactionsByIdUser(email: string, data: any) {
    
    const body = {
      ...data,
      deleted: false
    }
    delete body.cardId
    console.log('body', body);
    const result = await this.userModel.updateOne(
      { email, 'data_card._id': new mongoose.Types.ObjectId(data.cardId) }, 
      { $push: { 'data_card.$.transactions': body } }, // Cập nhật transactions trong đúng thẻ
      { new: true } // Trả về dữ liệu mới nhất sau khi update
    ).exec();  
    console.log('result', result);
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

  async sendMessage(message: string): Promise<void> {
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

  async sendImage(message: string): Promise<void> {
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



}
