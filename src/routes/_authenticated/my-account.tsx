import { createFileRoute } from '@tanstack/react-router';
import { AccountLayout } from '@/components/account/AccountLayout';
export const Route=createFileRoute('/_authenticated/my-account')({staticData:{sitemap:false},component:AccountLayout});
