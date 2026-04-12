import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import supabase from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'literary-club-fallback-secret';

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function register(req, res) {
  try {
    const { username, password, fullName, role } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ error: 'Username, password, and full name are required' });
    }
    const { data: existingUser } = await supabase.from('users').select('id').eq('username', username).single();
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    const userRole = (role === 'admin') ? 'admin' : 'coordinator';
    
    const { error } = await supabase.from('users').insert([{
      id, username, password: hashedPassword, role: userRole, fullName
    }]);
    
    if (error) throw error;

    res.status(201).json({
      message: 'User created successfully',
      user: { id, username, role: userRole, fullName }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMe(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, role, fullName, createdAt')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCoordinators(req, res) {
  try {
    const { data: coordinators, error } = await supabase
      .from('users')
      .select('id, username, fullName, createdAt')
      .eq('role', 'coordinator');
    if (error) throw error;
    res.json({ coordinators: coordinators || [] });
  } catch (err) {
    console.error('GetCoordinators error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllUsers(req, res) {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, fullName, role, createdAt')
      .order('role')
      .order('fullName');
    if (error) throw error;
    res.json({ users: users || [] });
  } catch (err) {
    console.error('GetAllUsers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const { error: deleteError } = await supabase.from('users').delete().eq('id', id);
    if (deleteError) throw deleteError;
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('DeleteUser error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
