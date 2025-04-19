# Sử dụng Node.js base image
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /usr/src/app

# Copy package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt dependencies
RUN yarn install

# Copy toàn bộ code của ứng dụng vào container
COPY . .

# Build ứng dụng NestJS
RUN yarn run build

# Expose port 3000 để có thể truy cập từ bên ngoài
EXPOSE 3000

# Khởi chạy ứng dụng
CMD ["yarn", "run", "start:prod"]