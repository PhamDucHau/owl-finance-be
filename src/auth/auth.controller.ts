import { Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import axios from "axios";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly httpService: HttpService) { }
  @Post('create')
  async createUser(@Body() body: any) {
    if (body.uid) {
      // Tạo user qua Firebase
      const { uid, email, name } = body;
      return this.authService.createUserWithFirebase({ uid, email, name });
    } else {
      // Tạo user qua form đăng ký
      const { name, email, password } = body;
      return this.authService.createUserWithForm({ name, email, password });
    }
  }
  @Post('login')
  async login(@Body() body: any) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }

  @UseGuards(AuthGuard)
  @Get()
  async getDataByIdUsertest(@Req() req) {
    return this.authService.getDataByIdUser(req.email);
  }

  @UseGuards(AuthGuard)
  @Post('create-card')
  async CreateDataByIdUser(@Req() req, @Body() body: any) {

    return this.authService.createDataByIdUser(req.email, body);

  }

  @UseGuards(AuthGuard)
  @Post('update-card')
  async UpdateDataByIdUser(@Req() req, @Body() body: any) {

    return this.authService.updateDataByIdUser(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('create-transactions')
  async CreateTransactionsByIdUser(@Req() req, @Body() body: any) {

    return this.authService.createTransactionsByIdUser(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('delete-transaction')
  async DeleteTransactionsByIdUser(@Req() req, @Body() body: any) {
    return this.authService.deleteTransactionsByIdUser(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('update-transaction')
  async UpdateTransactionsByIdUser(@Req() req, @Body() body: any) {
    return this.authService.updateTransactionByIdUser(req.email, body);
  }


  @UseGuards(AuthGuard)
  @Post('delete-card')
  async DeleteDataByIdUser(@Req() req, @Body() body: any) {
    return this.authService.deleteDataByIdUser(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post("verify-upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error("No file provided");
    }

    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append("file", blob, file.originalname);

    const headers = {
      "CLIENT-ID": "vrfL3blNnx5WyUT55XzoytdkRwuGsWcAyw5JPAV",
      AUTHORIZATION: "apikey lethihongxoan99:336deb935e8f3009eaf95f38e4b1aec6",
      "Content-Type": "multipart/form-data",
    };

    const response = await axios.post(
      "https://api.veryfi.com/api/v8/partner/documents",
      formData,
      { headers }
    );

    return response.data;
  }


  @Get('send')
  async sendTestMessage() {
    await this.authService.sendMessage('📢 Thử nghiệm gửi tin nhắn từ NestJS!');
    return { message: 'Tin nhắn đã được gửi!' };
  }

  @Get('send-image')
  async sendImage() {
    await this.authService.sendImage('http://khoadue.me:9000/imagefolder/billllllllllllllllllllllllllllllllllll.jpg');
    return { message: 'Tin nhắn đã được gửi!' };
  }

  @Post('send-message-ai')
  async sendMessageAI(@Body() body: any) {
    return await this.authService.sendMessageAI(body.message);
     
  }

  @UseGuards(AuthGuard)
  @Post('friends/request')
  async sendFriendRequest(@Req() req, @Body() body: any) {
    return await this.authService.sendFriendRequest(req.email, body.recipient);
  }

  @UseGuards(AuthGuard)
  @Post('friends/accept')
  async acceptFriendRequest(@Req() req, @Body() body: any) {
    return await this.authService.acceptFriendRequest(req.email, body.recipient);
  }

  @UseGuards(AuthGuard)
  @Post('friends/reject')
  async rejectFriendRequest(@Req() req, @Body() body: any) {
    return await this.authService.rejectFriendRequest(req.email, body.recipient);
  }

  

  @UseGuards(AuthGuard)
  @Get('friends/not-accepted')
  async getFriendsNotAccepted(@Req() req) {    
    return await this.authService.getFriendsNotAccepted(req.email);
  }

  @UseGuards(AuthGuard)
  @Get('friends/accepted')
  async getFriendsAccepted(@Req() req) {    
    return await this.authService.getFriendsAccepted(req.email);
  }

  @UseGuards(AuthGuard)
  @Get('all-email')
  async getAllEmail(@Req() req) {
    return await this.authService.getAllEmail(req.email);
  }

  @UseGuards(AuthGuard)
  @Post('friends/request-socket')
  async sendRequestSocket(@Req() req ,  @Body() body: any) {
    return await this.authService.sendRequestSocket(req.email, body.recipient, body.message);
  }

  @UseGuards(AuthGuard)
  @Post('plan/create')
  async createPlan(@Req() req, @Body() body: any) {
    return await this.authService.createPlan(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Get('plan/get-all')
  async getAllPlan(@Req() req) {
    return await this.authService.getAllPlan(req.email);
  }

  @UseGuards(AuthGuard)
  @Post('plan/update')
  async updatePlan(@Req() req, @Body() body: any) {
    return await this.authService.updatePlan(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('plan/delete')
  async deletePlan(@Req() req, @Body() body: any) {
    return await this.authService.deletePlan(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('connect-ai')
  async connectAI(@Req() req, @Body() body: any) {
    return await this.authService.connectAI(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Post('message/create')
  async createMessage(@Req() req, @Body() body: any) {
    return await this.authService.createMessage(req.email, body);
  }

  @UseGuards(AuthGuard)
  @Get('message/get-all')
  async getAllMessage(@Req() req) {
    return await this.authService.getAllMessage(req.email);
  }

  @UseGuards(AuthGuard)
  @Post('message/delete')
  async deleteMessage(@Req() req, @Body() body: any) {
    return await this.authService.deleteMessage(req.email, body);
  }





}
