'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../../../components/ui/AppIcon';
import AnimatedInput from './AnimatedInput';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import SocialLoginButton from './SocialLoginButton';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "L'adresse e-mail est requise";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Format d'e-mail invalide";
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json().catch(() => null as any);

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          general:
            data?.error ||
            "Identifiants incorrects. Veuillez vérifier votre e-mail et votre mot de passe.",
        }));
        setIsLoading(false);
        return;
      }

      try {
        const user = data?.user as
          | {
              id?: string;
              email?: string;
              user_metadata?: { nom?: string; prenom?: string; role?: string };
            }
          | undefined;

        if (typeof window !== 'undefined' && user) {
          const fullName = `${user.user_metadata?.prenom ?? ''} ${
            user.user_metadata?.nom ?? ''
          }`.trim();
          const displayName = fullName || user.email || 'Utilisateur';
          
          // Récupérer le rôle depuis la table profiles
          let role = null;
          try {
            const profileResponse = await fetch('/api/profiles');
            if (profileResponse.ok) {
              const profileData = await profileResponse.json().catch(() => null);
              role = profileData?.role ?? null;
            }
          } catch {
            // Si la récupération du profil échoue, garder le rôle de user_metadata
            role = user.user_metadata?.role ?? null;
          }

          window.localStorage.setItem(
            'stpro_user',
            JSON.stringify({
              id: user.id ?? null,
              displayName,
              email: user.email ?? null,
              role,
            })
          );
        }
      } catch {
        // En cas d'erreur de parsing ou de localStorage, on ignore simplement
      }

      router.push('/dashboard');
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        general: "Une erreur est survenue lors de la connexion. Veuillez réessayer.",
      }));
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
  };

  if (showForgotPassword) {
    return (
      <div className="space-y-6 animate-slide-in-from-top">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Réinitialiser le mot de passe</h2>
          <p className="text-slate-400 text-sm">
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation
          </p>
        </div>

        <form className="space-y-4">
          <AnimatedInput
            label="Adresse e-mail"
            type="email"
            iconName="EnvelopeIcon"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />

          <button
            type="submit"
            className="w-full py-4 gradient-rfidia text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-rfidia"
          >
            Envoyer le lien
          </button>

          <button
            type="button"
            onClick={() => setShowForgotPassword(false)}
            className="w-full text-sm text-slate-400 hover:text-white transition-colors duration-300"
          >
            Retour à la connexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <AnimatedInput
          label="Adresse e-mail"
          type="email"
          iconName="EnvelopeIcon"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
        />

        <div>
          <AnimatedInput
            label="Mot de passe"
            type="password"
            iconName="LockClosedIcon"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            error={errors.password}
          />
          {formData.password && <PasswordStrengthIndicator password={formData.password} />}
        </div>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl animate-slide-in-from-top">
          <p className="text-sm text-red-400 flex items-start gap-2">
            <Icon name="ExclamationTriangleIcon" size={18} className="flex-shrink-0 mt-0.5" />
            <span>{errors.general}</span>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-2 border-white/20 bg-white/5 checked:bg-violet-600 checked:border-violet-600 transition-all duration-300 cursor-pointer"
          />
          <span className="text-sm text-slate-400 group-hover:text-white transition-colors duration-300">
            Se souvenir de moi
          </span>
        </label>

        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-violet-400 hover:text-violet-300 transition-colors duration-300"
        >
          Mot de passe oublié?
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="relative w-full py-4 gradient-rfidia text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-rfidia overflow-hidden group"
      >
        <span className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          Se connecter
        </span>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400">Ou continuer avec</span>
        </div>
      </div>

 

      <p className="text-center text-sm text-slate-400">
        Pas encore de compte?{' '}
        <button
          type="button"
          className="text-violet-400 hover:text-violet-300 font-semibold transition-colors duration-300"
        >
          Créer un compte
        </button>
      </p>
    </form>
  );
}