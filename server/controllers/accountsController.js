import Transaction from '../models/Transaction.js';
import { getAll, getOne, updateOne, deleteOne } from './baseController.js';

export const createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: transaction });
  } catch (error) { next(error); }
};

export const getTransactions = getAll(Transaction, 'createdBy');
export const getTransaction = getOne(Transaction, 'createdBy');
export const updateTransaction = updateOne(Transaction);
export const deleteTransaction = deleteOne(Transaction);

export const getAccountsSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchStage = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};
    
    const [income, expense, categoryBreakdown, monthlySummary] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...matchStage, type: 'Income' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { ...matchStage, type: 'Expense' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: matchStage },
        { $group: { _id: { category: '$category', type: '$type' }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            income: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);
    
    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;
    const profit = totalIncome - totalExpense;
    
    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        profit,
        profitMargin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0,
        incomeCount: income[0]?.count || 0,
        expenseCount: expense[0]?.count || 0,
        categoryBreakdown,
        monthlySummary: monthlySummary.map(m => ({
          month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
          income: m.income,
          expense: m.expense,
          profit: m.income - m.expense
        }))
      }
    });
  } catch (error) { next(error); }
};

export const getMonthlyReport = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const report = await Transaction.aggregate([
      { $match: { date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);
    
    const formatted = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const monthData = report.filter(r => r._id.month === month);
      return {
        month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
        income: monthData.find(d => d._id.type === 'Income')?.total || 0,
        expense: monthData.find(d => d._id.type === 'Expense')?.total || 0
      };
    });
    
    res.json({ success: true, data: formatted });
  } catch (error) { next(error); }
};