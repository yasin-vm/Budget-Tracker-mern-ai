import Transaction from "../models/TransactionModel.js";
import Category from "../models/CategoryModel.js";
export const addTransaction = async (req, res) => {

    try {

        const {
            userId,
            amount,
            type,
            category,
            description,
            date
        } = req.body;

        const transaction = await Transaction.create({
            userId,
            amount,
            type,
            category,
            description,
            date
        });
        await Category.findOneAndUpdate(
            { name: category },
            { name: category },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            data: transaction
        });


    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTransactions = async (req, res) => {

    try {

        const { userId } = req.params;

        const transactions =
            await Transaction.find({
                userId: userId
            }).sort({
                _id: -1
            });

        res.status(200).json({
            success: true,
            data: transactions
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteTransaction = async (req, res) => {

    try {

        await Transaction.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: "Transaction deleted"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateTransaction = async (req, res) => {

    try {
        const { amount, type, category, description, date } = req.body;
        const updates = {};
        if (amount !== undefined) updates.amount = amount;
        if (type !== undefined) updates.type = type;
        if (category !== undefined) updates.category = category;
        if (description !== undefined) updates.description = description;
        if (date !== undefined) updates.date = date;

        const transaction =
            await Transaction.findByIdAndUpdate(

                req.params.id,

                updates,

                { returnDocument: "after", runValidators: true }

            );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        if (category !== undefined) {
            await Category.findOneAndUpdate(
                { name: category },
                { name: category },
                { upsert: true }
            );
        }

        res.status(200).json({
            success: true,
            data: transaction
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};