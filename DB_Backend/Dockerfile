#FROM node:19-alpine AS appbuild
#COPY ./package.json /
#COPY ./package-lock.json /
#COPY ./index.js  /
#RUN npm install
#RUN npm -v
#RUN npm start 
#FROM nginx
#COPY --from=appbuild /build /usr/share/nginx/html

FROM node:18-alpine AS development
ENV NODE_ENV development
# Add a work directory
WORKDIR /app
# Cache and Install dependencies
COPY package.json .
COPY package-lock.json .
RUN npm install
# Copy app files
COPY . .
# Expose port
EXPOSE 8800
# Start the app
CMD [ "npm", "start" ]
