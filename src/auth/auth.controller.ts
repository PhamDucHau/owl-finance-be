import { Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { HttpService } from '@nestjs/axios';
import { FileInterceptor } from '@nestjs/platform-express';
import axios from "axios";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService , private readonly httpService: HttpService) { }
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
      "CLIENT-ID": "vrfOvUFALW9sb9rVDcbvlgbJyt9h7mYtI0gnBoC",
      AUTHORIZATION: "apikey phaucau2311:74b76b71b5057806ea60194bacd9c7ac",
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



    
}
