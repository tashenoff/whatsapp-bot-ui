// Файл: pages/message-settings.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import BotMessageSettings from '../components/BotMessageSettings';

export default function MessageSettings() {
  return (
    <Layout>
      <Head>
        <title>Настройки сообщений - WhatsApp Bot Manager</title>
        <meta name="description" content="Настройка сообщений WhatsApp бота" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-500 dark:text-red-400">Настройки сообщений</h1>
          <div className="flex space-x-2">
            <Link href="/" className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 transition">
              Назад на главную
            </Link>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors duration-200">
          <BotMessageSettings />
        </div>
      </div>
    </Layout>
  );
}