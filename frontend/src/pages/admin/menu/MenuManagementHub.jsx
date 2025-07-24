import React from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  FaUtensils,
  FaList,
  FaCogs,
  FaTags,
  FaPercent,
  FaClock,
  FaImages,
  FaLanguage,
  FaChartBar,
} from 'react-icons/fa';
import '../../../styles/admin/menu/menuManagementHub.scss';

const MenuManagementHub = () => {
  const { restaurantSlug } = useParams();
  const user = useSelector((state) => state.auth.user);
  const restaurant = useSelector((state) => state.auth.restaurant);

  // Check if we're on a subdomain (no restaurantSlug in URL params)
  const isSubdomain =
    !restaurantSlug &&
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname.includes('.localhost');

  // Base path for navigation - different for subdomain vs main app
  const basePath = isSubdomain ? '' : `/${restaurantSlug}`;

  // Check user permissions
  const hasMenuAccess =
    user?.role === 'restaurant_administrator' ||
    user?.role === 'superadmin' ||
    (user?.role_location_pairs &&
      user.role_location_pairs.some(
        (pair) =>
          pair.role_name === 'restaurant_administrator' ||
          pair.role_name === 'location_administrator'
      ));

  if (!hasMenuAccess) {
    return (
      <div className="menu-management-hub">
        <div className="access-denied">
          <h2>Acesso Negado</h2>
          <p>
            Você não tem permissão para acessar as funcionalidades de gerenciamento de cardápio.
          </p>
        </div>
      </div>
    );
  }

  const menuSections = [
    {
      id: 'categories',
      title: 'Categorias do Cardápio',
      description: 'Organize a estrutura do seu cardápio com categorias e subcategorias',
      icon: <FaList />,
      path: `${basePath}/admin/menu/categories`,
      color: 'primary',
      features: [
        'Criar e organizar categorias',
        'Gerenciar subcategorias',
        'Definir ordem de exibição',
      ],
    },
    {
      id: 'items',
      title: 'Itens do Cardápio',
      description: 'Adicione, edite e gerencie os itens do cardápio do seu restaurante',
      icon: <FaUtensils />,
      path: `${basePath}/admin/menu/items`,
      color: 'secondary',
      features: [
        'Adicionar novos pratos',
        'Editar descrições e preços',
        'Gerenciar disponibilidade',
      ],
    },
    {
      id: 'modifiers',
      title: 'Modificadores e Opções',
      description: 'Configure opções de personalização para os itens do seu cardápio',
      icon: <FaCogs />,
      path: `${basePath}/admin/menu/modifiers`,
      color: 'accent',
      features: ['Complementos opcionais', 'Seleções obrigatórias', 'Ajustes de preço'],
    },
    {
      id: 'dietary',
      title: 'Dietas e Alérgenos',
      description: 'Gerencie rótulos dietéticos e informações sobre alérgenos',
      icon: <FaTags />,
      path: `${basePath}/admin/menu/dietary`,
      color: 'success',
      features: ['Etiquetas dietéticas', 'Avisos de alérgenos', 'Informações nutricionais'],
    },
    {
      id: 'promotions',
      title: 'Promoções e Ofertas',
      description: 'Crie e gerencie ofertas especiais e descontos',
      icon: <FaPercent />,
      path: `${basePath}/admin/menu/promotions`,
      color: 'warning',
      features: ['Promoções happy hour', 'Ofertas leve 2 pague 1', 'Descontos em combos'],
    },
    {
      id: 'availability',
      title: 'Disponibilidade e Agendamento',
      description: 'Controle quando os itens do cardápio estão disponíveis',
      icon: <FaClock />,
      path: `${basePath}/admin/menu/availability`,
      color: 'info',
      features: ['Disponibilidade por horário', 'Agendamento por dia', 'Cardápios sazonais'],
    },
    {
      id: 'media',
      title: 'Gerenciamento de Mídia',
      description: 'Faça upload e organize imagens e vídeos dos itens do cardápio',
      icon: <FaImages />,
      path: `${basePath}/admin/menu/media`,
      color: 'dark',
      features: ['Galerias de imagens', 'Conteúdo em vídeo', 'Organização de mídia'],
    },
    {
      id: 'translations',
      title: 'Multi-idiomas',
      description: 'Gerencie traduções do cardápio para diferentes idiomas',
      icon: <FaLanguage />,
      path: `${basePath}/admin/menu/translations`,
      color: 'primary',
      features: ['Múltiplos idiomas', 'Tradução de conteúdo', 'Alternar idiomas'],
    },
    {
      id: 'analytics',
      title: 'Análises do Cardápio',
      description: 'Acompanhe o desempenho do cardápio e itens populares',
      icon: <FaChartBar />,
      path: `${basePath}/admin/menu/analytics`,
      color: 'secondary',
      features: ['Itens populares', 'Acompanhamento de vendas', 'Relatórios de desempenho'],
    },
  ];

  return (
    <div className="menu-management-hub">
      <div className="menu-hub-header">
        <div className="menu-hub-title-section">
          <h1 className="menu-hub-title">Gerenciamento do Cardápio</h1>
          <p className="menu-hub-subtitle">
            Ferramentas abrangentes para criar, gerenciar e otimizar a experiência do cardápio
            digital do seu restaurante
          </p>
        </div>

        {restaurant && (
          <div className="restaurant-info-card">
            <h3>{restaurant.restaurant_name}</h3>
            <p className="restaurant-type">{restaurant.cuisine_type || 'Restaurante'}</p>
          </div>
        )}
      </div>

      <div className="menu-sections-grid">
        {menuSections.map((section) => (
          <div key={section.id} className={`menu-section-card ${section.color}`}>
            <Link to={section.path} className="menu-section-link">
              <div className="menu-section-header">
                <div className="menu-section-icon">{section.icon}</div>
                <div className="menu-section-info">
                  <h3 className="menu-section-title">{section.title}</h3>
                  <p className="menu-section-description">{section.description}</p>
                </div>
              </div>

              <div className="menu-section-features">
                <ul>
                  {section.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="menu-section-footer">
                <span className="menu-section-cta">Gerenciar →</span>
              </div>
            </Link>
          </div>
        ))}
      </div>

      <div className="menu-hub-footer">
        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-number">0</span>
            <span className="stat-label">Itens do Cardápio</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">0</span>
            <span className="stat-label">Categorias</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">0</span>
            <span className="stat-label">Promoções Ativas</span>
          </div>
        </div>

        <div className="help-section">
          <h4>Precisa de Ajuda?</h4>
          <p>
            Confira nosso guia abrangente sobre como configurar seu cardápio digital, ou entre em
            contato com o suporte para obter assistência.
          </p>
          <div className="help-actions">
            <button className="btn-help-guide">Ver Guia</button>
            <button className="btn-contact-support">Contatar Suporte</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuManagementHub;
