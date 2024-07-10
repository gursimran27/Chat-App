# Chat Application

## Features


1. **Msg Sending**
   - Ability to send msg's over sockets in real time.

2. **File Sending**
   - Ability to send files over sockets.

2. **File Preview**
   - Preview feature for different file types (image, video, PDF) based on the file extension.

3. **Reply to Message**
   - Users can reply to specific messages.

4. **Pin/Unpin Chats**
   - Functionality to pin and unpin one-to-one messages.

5. **Star Messages**
   - Feature to star important messages.

6. **Emoji Reactions**
   - Ability to react to messages with emojis.

7. **Pagination**
   - Fetching messages with skip and limit for pagination. Mean infinite-scroll.

8. **Delete for Me**
   - Ability to delete a message for the current user.

9. **Status of User**
   - Displaying the online status of users or his/her last seen in real time.

10. **Unread Message Count**
    - Showing the count of unread messages for each conversation in real time.

11. **Message Delivery Status**
    - Indicates if a message is delivered(double tick) or not(single tick)  or seen(double blue tick) in real time.

12. **Delete for Everyone**
    - Ability to delete a message for everyone within 10 minutes of sending. The delete button disappears after 10 minutes.

13. **User Typing Indicator**
    - Indicates when a user is typing and stops indicating when the user stops typing.

13. **Timeline**
    - Automatically inserts timeline markers in the chat, indicating "Today", "Yesterday", or specific dates for older messages.

13. **Receiving Message Notification**
    - Notification with sound effect on message receive.

13. **Message Send and Receive Sounds**
    - Play sound effects similar to WhatsApp for message sending and receiving.

## Installation

To install and run the application, follow these steps:

1. Clone the repository:
    ```sh
    git clone <repository-url>
    ```
2. Navigate to the project directory:
    ```sh
    cd chat-app
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```
4. Make your own `config.js` file by looking at the `example.config.js` file.

5. Navigate to the backend directory:
    ```sh
    cd Chat-App-Backend
    ```
6. Install the backend dependencies:
    ```sh
    npm install
    ```
7. Make your own `config.env` file by looking at the `config.env.example` file.

8. Navigate back to the project directory:
    ```sh
    cd ../chat-app
    ```
9. Start the application:
    ```sh
    npm run dev
    ```

This will run both the frontend and backend.


## Usage

After starting the application, you can access it in your web browser at `http://localhost:3000`. 

- **Sending Files:** Use the file input to send images, videos, or PDFs.
- **Message Reactions:** Hover over a message to react with an emoji.
- **Pin/Unpin Chats:** Use the pin icon to pin or unpin chats.
- **Star Messages:** Click the star icon to mark messages as important.
- **Pagination:** Scroll through messages to load more with pagination.
- **Delete Messages:** Use the delete button to remove messages for yourself or for everyone within 10 minutes.
- **User Typing Indicator:** See when the other user is typing in the chat.

## Technologies Used

- **Frontend:** React, Redux, Material-UI
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Real-time Communication:** Socket.io

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.


