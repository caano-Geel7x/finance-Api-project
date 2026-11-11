import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as transactionService from '../services/transactionService.js';

export async function create(request, response) {
  const transaction = await transactionService.createTransaction(request.user.id, request.body);
  response.status(201).json({ transaction });
}

export async function list(request, response) {
  const result = await transactionService.listTransactions(request.user.id, request.validatedQuery);
  response.status(200).json(result);
}

export async function monthlySummary(request, response) {
  const summary = await transactionService.getMonthlySummary(
    request.user.id,
    request.validatedQuery,
  );
  response.status(200).json({ summary });
}

export async function monthlyTrends(request, response) {
  const trends = await transactionService.getMonthlyTrends(request.user.id);
  response.status(200).json({ trends });
}

export async function dailyBreakdown(request, response) {
  const breakdown = await transactionService.getDailyBreakdown(
    request.user.id,
    request.validatedQuery,
  );
  response.status(200).json({ breakdown });
}

export async function customRangeSummary(request, response) {
  const summary = await transactionService.getCustomRangeSummary(
    request.user.id,
    request.validatedQuery,
  );
  response.status(200).json({ summary });
}

function csvCell(value) {
  const stringValue = String(value ?? '');
  const safeValue = /^[\t\r\n ]*[=+\-@]/.test(stringValue)
    ? `'${stringValue}`
    : stringValue;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

async function* transactionCsvRows(cursor) {
  yield 'Date,Title,Type,Category,Amount\r\n';
  for await (const transaction of cursor) {
    yield [
      transaction.date.toISOString(),
      transaction.title,
      transaction.type,
      transaction.categoryId?.name ?? '',
      transaction.amount.toString(),
    ].map(csvCell).join(',') + '\r\n';
  }
}

export async function exportCsv(request, response, next) {
  try {
    const cursor = await transactionService.getTransactionExportCursor(
      request.user.id,
      request.validatedQuery,
    );
    response.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="transactions.csv"',
      'Cache-Control': 'no-store',
    });
    await pipeline(Readable.from(transactionCsvRows(cursor)), response);
  } catch (error) {
    next(error);
  }
}

export async function update(request, response) {
  const transaction = await transactionService.updateTransaction(
    request.user.id,
    request.validatedParams.id,
    request.body,
  );
  response.status(200).json({ transaction });
}

export async function remove(request, response) {
  await transactionService.deleteTransaction(
    request.user.id,
    request.validatedParams.id,
  );
  response.status(204).end();
}
