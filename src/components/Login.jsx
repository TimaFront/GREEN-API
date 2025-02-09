import React, { useState } from 'react'

function Login({ onLogin }) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (idInstance && apiTokenInstance) {
      onLogin({ idInstance, apiTokenInstance })
    }
  }

  return (
      <div className="login">
        <form onSubmit={handleSubmit}>
          <input
              type="text"
              placeholder="Введите idInstance"
              value={idInstance}
              onChange={(e) => setIdInstance(e.target.value)}
              required
          />
          <input
              type="password"
              placeholder="Введите apiTokenInstance"
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              required
          />
          <button type="submit">Войти</button>
        </form>
      </div>
  )
}

export default Login
