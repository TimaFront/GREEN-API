import { useState } from 'react'
import Login from "./components/Login.jsx";
import Chat from "./components/Chat.jsx";
import './App.scss'

function App() {
  const [credentials, setCredentials] = useState(null)

  return (
      <div className="app">
        {!credentials ? (
            <Login onLogin={setCredentials} />
        ) : (
            <Chat credentials={credentials} />
        )}
      </div>
  )
}

export default App
