import React from "react";
import { BrowserRouter as Router ,Routes,Route } from "react-router-dom";

//pages
import WelcomePage from "./Pages/WelcomePage.jsx"
import SignIn from "./Pages/SignIn.jsx"
import SignUp from "./Pages/SignUp.jsx"
import Chat from "./Pages/Chat.jsx"

//css
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'

function App(){
  return(
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WelcomePage/>}/>
          <Route path="/signin" element={<SignIn/>}/>
          <Route path="/signup" element={<SignUp/>}/>
          <Route path="/chat" element={<Chat/>}/>
        </Routes>
      </div>
    </Router>
  );
}

export default App;