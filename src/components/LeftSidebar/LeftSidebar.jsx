import React, { useContext, useState } from 'react';
import './LeftSidebar.css';
import assets from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { arrayUnion, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';

const LeftSidebar = () => {
    const navigate = useNavigate();
    const { userData, chatData, chatUser, setChatUser, setMessagesId, messageId } = useContext(AppContext);

    const [user, setUser] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    const inputHandler = async (e) => {
        try {
            const input = e.target.value.trim();
            if (input) {
                setShowSearch(true);
                const userRef = collection(db, 'users');
                const q = query(userRef, where("username", "==", input.toLowerCase()));
                const querySnap = await getDocs(q);

                if (!querySnap.empty && querySnap.docs[0].data().id !== userData.id) {
                    let userExist = chatData.some((user) => user.rId === querySnap.docs[0].data().id);
                    if (!userExist) {
                        setUser(querySnap.docs[0].data());
                    }
                } else {
                    setUser(null);
                }
            } else {
                setShowSearch(false);
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };

    const addChat = async () => {
        try {
            if (!user) return;

            const messagesRef = collection(db, 'messages');
            const chatsRef = collection(db, "chats");
            const newMessageRef = doc(messagesRef);

            await setDoc(newMessageRef, {
                createdAt: serverTimestamp(),
                messages: [] // Fixed typo from 'onMessage' to 'messages'
            });

            const chatDataEntry = {
                messageId: newMessageRef.id,
                lastMessage: "",    
                rId: userData.id,
                updatedAt: Date.now(),
                messageSeen: true
            };

            // Update both users' chat data
            await updateDoc(doc(chatsRef, user.id), {
                chatsData: arrayUnion(chatDataEntry)
            });

            await updateDoc(doc(chatsRef, userData.id), {
                chatsData: arrayUnion({
                    ...chatDataEntry,
                    rId: user.id
                })
            });

        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };

    const setChat = async (item) => {
        try {
            setMessagesId(item.messageId);
            setChatUser(item);

            const userChatsRef = doc(db, 'chats', userData.id);
            const userChatsSnapshot = await getDoc(userChatsRef);

            if (userChatsSnapshot.exists()) {
                const userChatData = userChatsSnapshot.data();
                const chatIndex = userChatData.chatsData.findIndex((c) => c.messageId === item.messageId);

                if (chatIndex !== -1) {
                    userChatData.chatsData[chatIndex].messageSeen = true;

                    await updateDoc(userChatsRef, {
                        chatsData: userChatData.chatsData
                    });
                }
            }
        } catch (error) {
            toast.error(error.message);
            console.error(error);
        }
    };

    return (
        <div className='ls'>
            <div className="ls-top">
                <div className="ls-nav">
                    <img src={assets.logo} className='logo' alt="logo" />
                    <div className="menu">
                        <img src={assets.menu_icon} alt="menu icon" />
                        <div className="sub-menu">
                            <p onClick={() => navigate('/profile')}>Edit profile</p>
                            <hr />
                            <p>Log Out</p>
                        </div>
                    </div>
                </div>
                <div className="ls-search">
                    <img src={assets.search_icon} alt="search icon" />
                    <input onChange={inputHandler} type="text" placeholder='Search here..' />
                </div>
            </div>
            <div className="ls-list">
                {showSearch && user ? (
                    <div onClick={addChat} className="friends add-user">
                        <img src={user.avatar} alt="user avatar" />
                        <p>{user.name}</p>
                    </div>
                ) : (
                    chatData.map((item, index) => (
                        <div 
                            onClick={() => setChat(item)} 
                            key={index} 
                            className={`friends ${item.messageSeen || item.messageId === messageId ? "" : "border"}`}
                        >
                            <img src={item.userData.avatar} alt="chat user avatar" />
                            <div>
                                <p>{item.userData.name}</p>
                                <span>{item.lastMessage ? item.lastMessage : "Start a conversation..."}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeftSidebar;
