import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Home from './pages/home/Home'

import MainLayout from "./components/Layout/MainLayout/MainLayout";

import Login from "./pages/users/Login";
import Register from "./pages/users/Register";
import Profile from "./pages/users/Profile";

import SearchOrders from "./pages/homework/SearchOrders";
import MyOrders from "./pages/homework/Order/MyOrders";
import OrderDetail from "./pages/homework/Order/OrderDetail";
import MyBids from "./pages/homework/MyBids"

import Chats from "./pages/chats/MyChats";
import ChatDetail from "./pages/chats/ChatDetail";
import MyDisputes from "./pages/homework/Disputes/MyDisputes";
import MyDisputesDetail from "./pages/homework/Disputes/DisputesDetail";
import NotFoundPage from "./components/Ui/NotFoundPage/NotFoundPage";
import AuthSuccess from "./pages/users/AuthSucces";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element= {<Home />}/>
        <Route path="/login" element= {<Login />} />
        <Route path="/register" element= {<Register />} />
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route element={<MainLayout />}>
          <Route path="/profile" element={<Navigate to="/profile/me" replace />} />
          <Route path="/profile/:userId" element={<Profile />} />


          <Route path="/search" element={<SearchOrders />} />
          <Route path="/search/:id" element={<OrderDetail />} />

          <Route path="/chats" element={<Chats />} />
          <Route path="/chats/:chatId" element={<ChatDetail />} />

          <Route path="/myOrders" element={<MyOrders />} />

          <Route path="/myBids" element={<MyBids />} />

          <Route path="/myDisputes" element={<MyDisputes />} />
          <Route path="/myDisputes/:disputeId" element={<MyDisputesDetail />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        
      </Routes>
    </Router>
  )
}


