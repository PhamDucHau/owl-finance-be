import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './auth/schemas/user.schema';
import { Model } from 'mongoose';

@Injectable()
export class AppService {  
  async getHello(req: any) {
    console.log(req.email);
    return {
      email: req.email
    }
  }
}
