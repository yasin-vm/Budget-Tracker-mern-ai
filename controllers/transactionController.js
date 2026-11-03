import Transaction from "../models/TransactionModel.js";
import Category from "../models/CategoryModel.js";
export const addTransaction = async (req, res) => {

    try {

        const {
            amount,
            type,
            category,
            description,
            date
        } = req.body;

        if (!Number.isFinite(Number(amount)) || Number(amount) <= 0
            || !["income", "expense"].includes(type)
            || typeof category !== "string" || !category.trim()) {
            return res.status(400).json({
                success: false,
                message: "A positive amount, valid type, and category are required"
            });
        }

        const transaction = await Transaction.create({
            userId: req.user._id,
            amount,
            type,
            category: category.trim(),
            description,
            date
        });
        await Category.findOneAndUpdate(
            { name: category.trim() },
            { name: category.trim() },
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
        if (String(req.user._id) !== userId) {
            return res.status(403).json({ success: false, message: "You can only access your own transactions" });
        }

        const transactions =
            await Transaction.find({
                userId: req.user._id
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

        const transaction = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found" });
        }

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

        const transaction = await Transaction.findOneAndUpdate({
            _id: req.params.id,
            userId: req.user._id
        }, updates, { returnDocument: "after", runValidators: true });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        if (category !== undefined) {
            await Category.findOneAndUpdate(
                { name: category.trim() },
                { name: category.trim() },
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