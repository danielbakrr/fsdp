import React, { useState } from 'react';
import "../styles/login.css"; 
import logo from "../assets/githubbies-logo.jpg";
import { useNavigate } from 'react-router-dom';

const Login = () => {
    let navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('https://githubbiesbackend.onrender.com/api/userLogin', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
    
            // Log the raw response before parsing it as JSON
            const textResponse = await response.text();
            console.log('Raw Response:', textResponse);
    
            // Check if the response is valid JSON
            let data;
            try {
            data = textResponse ? JSON.parse(textResponse) : null;
            } catch (parseError) {
            console.error('Failed to parse JSON:', parseError);
            throw new Error('Invalid response from server');
            }

            if (!response.ok) {
            console.error('Response Data:', data);
            throw new Error(data?.message || 'Invalid email or password');
            }

            if (!data || !data.token) {
            throw new Error('Token not found in response');
            }

            console.log('Login successful', data);
            localStorage.setItem('token', data.token); // Save token
            navigate('/Home');
        } catch (err) {
            console.error('Login failed', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
        };
    
    return (
        <div className="login-page">
            <div className="logo-container">
                <img src={logo} alt="Logo" />
            </div>
            <div className="login-container">
                <h2>Login</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <div className="error-message">{error}</div>}
                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;