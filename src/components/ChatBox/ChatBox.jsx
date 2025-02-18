import React, { useContext, useEffect, useState } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';

const ChatBox = () => {
    const { userData, messagesId, chatUser, messages, setMessages, setChatData } = useContext(AppContext);
    const [input, setInput] = useState("");

    const sendMessage = async () => {
        try {
            if (input.trim() && messagesId) {
                const messageData = {
                    sId: userData.id,
                    text: input,
                    createdAt: new Date()
                };

                // Update Firestore messages collection
                await updateDoc(doc(db, 'messages', messagesId), {
                    message: arrayUnion(messageData)
                });

                const userIDs = [chatUser.rId, userData.id];

                for (const id of userIDs) {
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);

                    if (userChatsSnapshot.exists()) {
                        let userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c) => c.messagesId === messagesId);

                        if (chatIndex !== -1) {
                            userChatData.chatsData[chatIndex] = {
                                ...userChatData.chatsData[chatIndex],
                                lastMessage: input.slice(0, 30),
                                updatedAt: Date.now(),
                                messageSeen: userChatData.chatsData[chatIndex].rId === userData.id ? false : true
                            };

                            await updateDoc(userChatsRef, {
                                chatsData: userChatData.chatsData
                            });

                            // Update UI for sidebar
                            setChatData(prevChatData => {
                                return prevChatData.map(chat =>
                                    chat.messagesId === messagesId
                                        ? { ...chat, lastMessage: input.slice(0, 30), updatedAt: Date.now() }
                                        : chat
                                );
                            });
                        }
                    }
                }
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
        setInput("");
    };
    const sendImage = async(e)=>{
        try{
            const fileUrl = await upload(e.target.files[0]);
            if(fileUrl && messagesId){
                const messageData = {
                    sId: userData.id,
                    Image: fileUrl,
                    createdAt: new Date()
                };

                // Update Firestore messages collection
                await updateDoc(doc(db, 'messages', messagesId), {
                    message: arrayUnion(messageData)
                });
                const userIDs = [chatUser.rId, userData.id];

                for (const id of userIDs) {
                    const userChatsRef = doc(db, 'chats', id);
                    const userChatsSnapshot = await getDoc(userChatsRef);

                    if (userChatsSnapshot.exists()) {
                        let userChatData = userChatsSnapshot.data();
                        const chatIndex = userChatData.chatsData.findIndex((c) => c.messagesId === messagesId);

                        if (chatIndex !== -1) {
                            userChatData.chatsData[chatIndex] = {
                                ...userChatData.chatsData[chatIndex],
                                lastMessage: "Image",
                                updatedAt: Date.now(),
                                messageSeen: userChatData.chatsData[chatIndex].rId === userData.id ? false : true
                            };

                            await updateDoc(userChatsRef, {
                                chatsData: userChatData.chatsData
                            });

                            // Update UI for sidebar
                            setChatData(prevChatData => {
                                return prevChatData.map(chat =>
                                    chat.messagesId === messagesId
                                        ? { ...chat, lastMessage: input.slice(0, 30), updatedAt: Date.now() }
                                        : chat
                                );
                            });
                        }
                    }
                }
            }
        }catch(error){
            toast.error(error.message);
            console.error(error);
        }
    }

    const convertTimestamp = (timestamp) => {
        if (!timestamp) return "";
        let date = timestamp instanceof Date ? timestamp : timestamp.toDate();
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return hours >= 12 ? `${hours - 12}:${minutes} PM` : `${hours}:${minutes} AM`;
    };

    useEffect(() => {
        if (messagesId) {
            const unSub = onSnapshot(doc(db, 'messages', messagesId), (res) => {
                const data = res.data();
                if (data && data.message) {
                    setMessages(data.message.reverse());

                    // Update last message in the sidebar UI
                    setChatData(prevChatData => {
                        return prevChatData.map(chat =>
                            chat.messagesId === messagesId
                                ? { ...chat, lastMessage: data.message[data.message.length - 1].text }
                                : chat
                        );
                    });
                } else {
                    setMessages([]);
                }
            });

            return () => unSub();
        }
    }, [messagesId, setMessages, setChatData]);

    return chatUser ? (
        <div className='chat-box'>
            <div className='chat-user'>
                <img src={chatUser.userData?.avatar || assets.default_avatar} alt='' />
                <p>{chatUser.userData?.name} <img className='dot' src={assets.green_dot} alt='' /></p>
                <img src={assets.help_icon} className='help' alt='' />
            </div>

            <div className='chat-msg'>
                {messages.map((msg, index) => (
                    <div key={index} className={msg.sId === userData.id ? 's-msg' : 'r-msg'}>
                        {msg["image"]
                        ? <img className='msg-img' src={msg.image} alt=""/>
                        : <p className='msg'>{msg.text}</p>
                        }
                        
                        <div>
                            <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData?.avatar} alt='' />
                            <p>{convertTimestamp(msg.createdAt)}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className='chat-input'>
                <input onChange={(e) => setInput(e.target.value)} value={input} type='text' placeholder='Send a message' />
                <input onChange={sendImage} type='file' id='image' accept='image/png, image/jpeg' hidden />
                <label htmlFor='image'>
                    <img src={assets.gallery_icon} alt='' />
                </label>
                <img onClick={sendMessage} src={assets.send_button} alt='' />
            </div>
        </div>
    ) : (
        <div className='chat-welcome'>
            <img src={assets.logo_icon} alt='' />
            <p>Chat anytime, anywhere</p>
        </div>
    );
};

export default ChatBox;
