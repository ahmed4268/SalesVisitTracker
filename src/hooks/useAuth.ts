import { useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  telephone?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/profiles');
        if (response.ok) {
          const data = await response.json();
          console.log('User profile from API:', data);
          console.log('User role:', data?.role);
          setUser(data);
          const adminCheck = data?.role === 'admin' || data?.role === 'Admin';
          console.log('isAdmin result:', adminCheck);
          setIsAdmin(adminCheck);
        } else {
          console.error('Profiles API error:', response.status);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, isAdmin };
}
