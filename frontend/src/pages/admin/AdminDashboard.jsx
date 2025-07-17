import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../../styles/admin/adminDashboard.scss';

const AdminDashboard = () => {
  const user = useSelector((state) => state.auth.user);

  // Helper function to check if user has admin access
  const checkAdminAccess = (user) => {
    if (!user) return false;

    // Admin roles that can access admin features
    const adminRoles = ['restaurant_administrator', 'location_administrator'];

    // Check primary role (backward compatibility)
    if (user.role && adminRoles.includes(user.role)) {
      return true;
    }

    // Check all roles if available (future enhancement)
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some(
        (roleObj) => roleObj.role_name && adminRoles.includes(roleObj.role_name)
      );
    }

    // Check is_admin flag as fallback
    if (user.is_admin === true) {
      return true;
    }

    return false;
  };

  // Check if user is restaurant administrator
  const isRestaurantAdmin = checkAdminAccess(user);

  const adminCards = [
    {
      title: 'Gerenciar Menu',
      description:
        'Adicione, edite ou remova itens do cardápio do restaurante. Configure preços, descrições e disponibilidade.',
      icon: '🍽️',
      link: `/admin/menu`,
      color: 'primary',
    },
    {
      title: 'Gerenciar Usuários',
      description:
        'Visualize e gerencie usuários do sistema. Controle permissões e status de contas.',
      icon: '👥',
      link: `/admin/users`,
      color: 'secondary',
    },
    {
      title: 'Meu Perfil',
      description: 'Atualize suas informações pessoais, altere sua senha e configure preferências.',
      icon: '👤',
      link: `/admin/user-profile`,
      color: 'tertiary',
    },
  ];

  // Add restaurant profile card only for restaurant admins
  if (isRestaurantAdmin) {
    adminCards.splice(2, 0, {
      title: 'Perfil do Restaurante',
      description:
        'Configure informações do restaurante, horários de funcionamento, dados de contato e configurações.',
      icon: '🏪',
      link: `/admin/restaurant-profile`,
      color: 'accent',
    });
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1 className="admin-dashboard-title">Painel Administrativo</h1>
        <p className="admin-dashboard-subtitle">
          Bem-vindo ao sistema de administração do restaurante. Aqui você pode gerenciar todos os
          aspectos do seu estabelecimento.
        </p>
      </div>

      <div className="admin-dashboard-content">
        <section className="admin-overview">
          <h2 className="admin-section-title">Visão Geral</h2>
          <p className="admin-section-description">
            Este painel permite que você gerencie eficientemente seu restaurante através de uma
            interface intuitiva e moderna. Utilize os módulos abaixo para acessar as diferentes
            funcionalidades do sistema.
          </p>
        </section>

        <section className="admin-modules">
          <h2 className="admin-section-title">Módulos Disponíveis</h2>
          <div className="admin-cards-grid">
            {adminCards.map((card, index) => (
              <Link key={index} to={card.link} className={`admin-card admin-card-${card.color}`}>
                <div className="admin-card-icon">
                  <span>{card.icon}</span>
                </div>
                <div className="admin-card-content">
                  <h3 className="admin-card-title">{card.title}</h3>
                  <p className="admin-card-description">{card.description}</p>
                </div>
                <div className="admin-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="admin-quick-info">
          <h2 className="admin-section-title">Informações Importantes</h2>
          <div className="admin-info-cards">
            <div className="admin-info-card">
              <h4>🔐 Segurança</h4>
              <p>
                Mantenha sempre suas credenciais seguras e faça logout ao terminar de usar o
                sistema.
              </p>
            </div>
            <div className="admin-info-card">
              <h4>📱 Responsivo</h4>
              <p>Este sistema é otimizado para desktop, tablet e celular para sua conveniência.</p>
            </div>
            <div className="admin-info-card">
              <h4>💡 Suporte</h4>
              <p>Em caso de dúvidas ou problemas, entre em contato com o suporte técnico.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
