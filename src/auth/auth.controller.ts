import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from 'src/guards/auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }
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
    
}
