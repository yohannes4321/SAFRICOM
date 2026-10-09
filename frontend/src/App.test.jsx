import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
let tasks;
beforeEach(() => {
  tasks = [];
  vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    if (method === 'POST') tasks = [{ id: 1, ...JSON.parse(options.body) }];
    if (method === 'PUT') tasks = [{ id: 1, ...JSON.parse(options.body) }];
    if (method === 'DELETE') tasks = [];
    return { ok: true, status: method === 'DELETE' ? 204 : 200, json: async () => method === 'GET' ? [...tasks] : tasks[0] };
  }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('creates, edits, cancels deletion, and confirms deletion', async () => {
  render(<App />);
  await screen.findByText('A fresh start.');
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: 'Prepare report' } });
  fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Weekly draft' } });
  fireEvent.click(screen.getByRole('button', { name: '+ Create task' }));
  await screen.findByRole('heading', { name: 'Prepare report' });
  expect(screen.getByText('Weekly draft')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Edit Prepare report' }));
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'DONE' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
  await screen.findByText('Task updated.');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Delete Prepare report' })).toBeEnabled());
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Prepare report' }));
  expect(screen.getByRole('heading', { name: 'Prepare report' })).toBeInTheDocument();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Prepare report' }));
  await screen.findByText('A fresh start.');
  expect(fetch.mock.calls.some(([, options]) => options.method === 'PUT' && JSON.parse(options.body).status === 'DONE')).toBe(true);
});
it('shows connection errors and retries', async () => {
  fetch.mockRejectedValueOnce(new Error('offline'));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Cannot connect to the API');
  fireEvent.click(screen.getByRole('button', { name: 'Retry loading' }));
  await screen.findByText('A fresh start.');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
it('rejects a whitespace title', async () => {
  render(<App />); await screen.findByText('A fresh start.');
  fireEvent.change(screen.getByLabelText(/Title/), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: '+ Create task' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Title must contain');
  expect(fetch).toHaveBeenCalledTimes(1);
});
