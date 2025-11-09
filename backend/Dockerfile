FROM node:25-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Copy and set executable permissions for entrypoint
COPY entrypoint.sh /usr/src/app/
RUN chmod +x /usr/src/app/entrypoint.sh

EXPOSE 3000

CMD ["/usr/src/app/entrypoint.sh"]