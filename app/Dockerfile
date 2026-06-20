FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
