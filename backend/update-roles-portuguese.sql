-- Update role descriptions to Portuguese
UPDATE roles SET
    display_name = 'Super Administrador',
    description = 'Acesso completo ao sistema da plataforma à la carte'
WHERE name = 'superadmin';

UPDATE roles SET
    display_name = 'Administrador do Restaurante',
    description = 'Acesso completo de gerenciamento do restaurante em todas as unidades'
WHERE name = 'restaurant_administrator';

UPDATE roles SET
    display_name = 'Administrador de Unidade',
    description = 'Acesso de gerenciamento para múltiplas unidades específicas'
WHERE name = 'location_administrator';

UPDATE roles SET
    display_name = 'Garçom',
    description = 'Equipe de atendimento para anotar pedidos e servir clientes'
WHERE name = 'waiter';

UPDATE roles SET
    display_name = 'Entregador',
    description = 'Funcionário responsável por entregar comida aos clientes'
WHERE name = 'food_runner';

UPDATE roles SET
    display_name = 'Operador de Tela da Cozinha',
    description = 'Funcionário da cozinha gerenciando o fluxo de preparo dos alimentos'
WHERE name = 'kds_operator';

UPDATE roles SET
    display_name = 'Operador de PDV',
    description = 'Funcionário operando sistemas de ponto de venda'
WHERE name = 'pos_operator';
