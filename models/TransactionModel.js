import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(

  {

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01
    },

    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },

    category: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String
    },

    date: {
      type: Date,
      default: Date.now
    }

  },

  {
    timestamps: true
  }

);

const Transaction = mongoose.model(
  "transactions",
  transactionSchema
);

export default Transaction;