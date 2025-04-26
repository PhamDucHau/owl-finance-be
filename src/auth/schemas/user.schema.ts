import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class transactions {
  @Prop({ required: true })
  money: string;
  @Prop({ required: true })
  category: string;
  @Prop({ required: true })
  product: string;
  @Prop({ required: true })
  quantity: string;
  @Prop({ })
  total: string;  
  @Prop({ })
  brand: string;
  @Prop({ })
  logo: string;
  @Prop({ required: false, default: false })
  deleted: boolean;
}

@Schema({ timestamps: true })
export class dataCard {
    @Prop({ required: false, default: null })
    bank_name: string | null;

    @Prop({ required: false, default: null })
    card_number: string;

    @Prop({ required: false, default: null })
    due_date: string;

    @Prop({ required: false, default: null })
    remaining_month: string;

    @Prop({ required: false, default: null })
    money_per_month: string;    

    @Prop({ required: false, default: false })
    deleted: boolean;
    @Prop({ required: false, default: null })
    send: boolean;
    @Prop({ type: [transactions], default: [] })  // 👈 Thêm default []
    transactions?: transactions[];  
}

@Schema({ timestamps: true })
export class friendships {  
  @Prop({ required: true })
  recipient: string;
  @Prop({ required: false})
  status: string;
  @Prop({ required: false})
  recipient_gmail: string;
  @Prop({ required: false})
  total: number;
}

@Schema({ timestamps: true })
export class plan {
  @Prop({ required: false })
  name: string;
  @Prop({ required: false })
  image: string;  
  @Prop({ required: false })
  price: number;  
  @Prop({ required: false })
  date_start: string;
  @Prop({ required: false })
  date_end: string;
  @Prop({ required: false })
  status: string;
}

@Schema({ timestamps: true })
export class message {
  @Prop({ required: true })
  sender: string;
  @Prop({ required: true })
  content: string;  
}

@Schema({ collection: 'users', timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop()
  password?: string; // Chỉ cần khi đăng ký qua form

  @Prop({ unique: true, sparse: true })
  uid?: string; // UID từ Firebase
  @Prop({ type: [dataCard] })
  data_card?: dataCard[];

  @Prop({ type: [friendships] })
  friendships?: friendships[];

  @Prop({ type: [plan] })
  plan?: plan[];

  @Prop({ type: [message] })
  message?: message[];
}

export const UserSchema = SchemaFactory.createForClass(User);