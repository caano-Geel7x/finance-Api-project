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
