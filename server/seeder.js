const sql = require('mssql');
const path = require('path');
const bcrypt = require('bcryptjs');
const productsData = require('./data/products.js');
const usersData = require('./data/users.js');
const { pool, poolConnect, closePool } = require('./config/db.js');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const importData = async () => {
    const transaction = new sql.Transaction(pool);
    try {
        await poolConnect;
        console.log('✅ Database connection established for seeding.');
        await transaction.begin();
        console.log('🏁 Transaction started.');

        // 1. Xóa dữ liệu cũ theo đúng thứ tự khóa ngoại
        console.log('🚮 Clearing existing data...');
        await new sql.Request(transaction).query('DELETE FROM Reviews');
        await new sql.Request(transaction).query('DELETE FROM OrderItems');
        await new sql.Request(transaction).query('DELETE FROM Orders');
        await new sql.Request(transaction).query('DELETE FROM Products');
        await new sql.Request(transaction).query('DELETE FROM Subscribers');
        await new sql.Request(transaction).query('DELETE FROM Users');
        await new sql.Request(transaction).query('DELETE FROM Categories');
        await new sql.Request(transaction).query('DELETE FROM Brands');
        console.log('✅ Existing data cleared.');
        
        // 2. Chèn Users
        console.log('🌱 Inserting Users...');
        for (const user of usersData) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(user.password, salt);
            
            await new sql.Request(transaction)
                .input('Name', sql.NVarChar, user.name)
                .input('Email', sql.NVarChar, user.email)
                .input('Password', sql.NVarChar, hashedPassword)
                .input('Role', sql.NVarChar, user.role)
                .query('INSERT INTO Users (Name, Email, Password, Role) VALUES (@Name, @Email, @Password, @Role)');
        }
        console.log('✅ Users inserted.');

        // 3. Chèn Brands và Categories
        console.log('🌱 Inserting Brands and Categories...');
        const brands = [...new Set(productsData.map(p => p.brand))];
        const brandNameToIdMap = new Map();
        for (const brandName of brands) {
            const result = await new sql.Request(transaction)
                .input('Name', sql.NVarChar, brandName)
                .query('INSERT INTO Brands (Name) OUTPUT INSERTED.Id VALUES (@Name)');
            brandNameToIdMap.set(brandName, result.recordset[0].Id);
        }

        const categories = [...new Set(productsData.map(p => p.mainCategory))];
        const categoryNameToIdMap = new Map();
        for (const categoryName of categories) {
             const result = await new sql.Request(transaction)
                .input('Name', sql.NVarChar, categoryName)
                .query('INSERT INTO Categories (Name) OUTPUT INSERTED.Id VALUES (@Name)');
            categoryNameToIdMap.set(categoryName, result.recordset[0].Id);
        }
        console.log('✅ Brands and Categories inserted.');

        // 4. Chèn Products
        console.log('🌱 Inserting Products...');
        for (const product of productsData) {
            if (!brandNameToIdMap.has(product.brand) || !categoryNameToIdMap.has(product.mainCategory)) {
                console.warn(`Skipping product "${product.name}" due to missing brand or category.`);
                continue;
            }
            
            const request = new sql.Request(transaction);
            
            request.input('Name', sql.NVarChar, product.name);
            request.input('Price', sql.Decimal(18, 2), product.price);
            request.input('OriginalPrice', sql.Decimal(18, 2), product.originalPrice);
            request.input('Image', sql.NVarChar, product.image);
            request.input('Images', sql.NVarChar, product.images);
            request.input('Description', sql.NVarChar(1000), product.description);
            request.input('FullDescription', sql.NVarChar(sql.MAX), product.fullDescription);
            request.input('Rating', sql.Decimal(3, 2), product.rating || 0);
            request.input('NumReviews', sql.Int, product.numReviews || 0);
            request.input('IsPromotional', sql.Bit, product.isPromotional || false);
            request.input('CountInStock', sql.Int, product.countInStock);
            request.input('Warranty', sql.NVarChar, product.warranty);
            request.input('YoutubeLink', sql.NVarChar, product.youtubeLink);
            request.input('Specifications', sql.NVarChar(sql.MAX), product.specifications);
            request.input('BrandId', sql.Int, brandNameToIdMap.get(product.brand));
            request.input('CategoryId', sql.Int, categoryNameToIdMap.get(product.mainCategory));
            request.input('SubCategory', sql.NVarChar, product.subCategory || null);

            await request.query(`
                INSERT INTO Products (
                    Name, Price, OriginalPrice, Image, Images, Description, FullDescription, 
                    Rating, NumReviews, IsPromotional, CountInStock, Warranty, YoutubeLink, 
                    Specifications, BrandId, CategoryId, SubCategory
                ) VALUES (
                    @Name, @Price, @OriginalPrice, @Image, @Images, @Description, @FullDescription,
                    @Rating, @NumReviews, @IsPromotional, @CountInStock, @Warranty, @YoutubeLink,
                    @Specifications, @BrandId, @CategoryId, @SubCategory
                )
            `);
        }
        console.log('✅ Products inserted.');

        await transaction.commit();
        console.log('🎉 Transaction committed.');
        console.log('✅ Data Imported Successfully!');
    } catch (error) {
        console.error('❌ Error during data import:', error);
        if (transaction.rolledBack === false) {
           await transaction.rollback();
           console.log('Transaction rolled back due to error.');
        }
    } finally {
        await closePool();
        process.exit(0);
    }
};

const destroyData = async () => {
    try {
        await poolConnect;
        console.log('✅ Database connection established for destroying data.');
        
        const request = pool.request();
        console.log('🔥 Deleting all data...');
        await request.query('DELETE FROM Reviews');
        await request.query('DELETE FROM OrderItems');
        await request.query('DELETE FROM Orders');
        await request.query('DELETE FROM Products');
        await request.query('DELETE FROM Subscribers');
        await request.query('DELETE FROM Users');
        await request.query('DELETE FROM Categories');
        await request.query('DELETE FROM Brands');
        
        console.log('✅ Data Destroyed Successfully!');
    } catch (error) {
        console.error('❌ Error during data destruction:', error);
    } finally {
        await closePool();
        process.exit(0);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}