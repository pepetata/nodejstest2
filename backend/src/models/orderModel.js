const db = require('../config/db');

class OrderModel {
    async create(orderData) {
        const { userId, items, totalAmount, deliveryAddress, specialInstructions, status } = orderData;
        
        const client = await db.getClient();
        try {
            await client.query('BEGIN');

            // Create order
            const orderQuery = `
                INSERT INTO orders (user_id, total_amount, delivery_address, special_instructions, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
                RETURNING *
            `;
            const orderResult = await client.query(orderQuery, [userId, totalAmount, deliveryAddress, specialInstructions, status]);
            const order = orderResult.rows[0];

            // Create order items
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
                    VALUES ($1, $2, $3, (SELECT price FROM menu_items WHERE id = $2))
                `;
                await client.query(itemQuery, [order.id, item.menuItemId, item.quantity]);
            }

            await client.query('COMMIT');

            // Return order with items
            return await this.findById(order.id);
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async findById(id) {
        const orderQuery = `
            SELECT o.*, u.name as user_name, u.email as user_email
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.id = $1
        `;
        const orderResult = await db.query(orderQuery, [id]);
        
        if (orderResult.rows.length === 0) {
            return null;
        }

        const order = orderResult.rows[0];

        // Get order items
        const itemsQuery = `
            SELECT oi.*, mi.name, mi.description, mi.image
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = $1
        `;
        const itemsResult = await db.query(itemsQuery, [id]);
        order.items = itemsResult.rows;

        return order;
    }

    async findByUserId(userId) {
        const query = `
            SELECT * FROM orders 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    async updateStatus(id, status) {
        const query = `
            UPDATE orders 
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING *
        `;
        const result = await db.query(query, [id, status]);
        return result.rows[0];
    }

    async delete(id) {
        const client = await db.getClient();
        try {
            await client.query('BEGIN');
            
            // Delete order items first
            await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);
            
            // Delete order
            await client.query('DELETE FROM orders WHERE id = $1', [id]);
            
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new OrderModel();
