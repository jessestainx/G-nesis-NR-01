import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { AuthProvider } from '@/contexts/AuthContext'
import { queryClient } from '@/lib/queryClient'
import { env } from '@/lib/env'

import { Home } from '@/pages/Home'
import { NotFound } from '@/pages/NotFound'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardRouter } from '@/pages/DashboardRouter'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { GenesisOverview } from '@/pages/genesis/GenesisOverview'
import { OrganizationsPage } from '@/pages/genesis/OrganizationsPage'
import { UsersPage } from '@/pages/genesis/UsersPage'
import { CrmPage } from '@/pages/genesis/CrmPage'
import { FinancePage } from '@/pages/genesis/FinancePage'
import { DiagnosisPage } from '@/pages/genesis/DiagnosisPage'
import { ActionPlansPage } from '@/pages/genesis/ActionPlansPage'
import { AuditPage } from '@/pages/genesis/AuditPage'

import { ClientOverview } from '@/pages/client/ClientOverview'
import { ClientDiagnosisPage } from '@/pages/client/ClientDiagnosisPage'
import { ClientRisksPage } from '@/pages/client/ClientRisksPage'
import { ClientActionPlansPage } from '@/pages/client/ClientActionPlansPage'
import { ClientDocumentsPage } from '@/pages/client/ClientDocumentsPage'
import { ClientTrainingsPage } from '@/pages/client/ClientTrainingsPage'
import { ClientPulsePage } from '@/pages/client/ClientPulsePage'

import { CollaboratorOverview } from '@/pages/collaborator/CollaboratorOverview'
import { CollaboratorSurveyPage } from '@/pages/collaborator/CollaboratorSurveyPage'
import { CollaboratorPrivacyPage } from '@/pages/collaborator/CollaboratorPrivacyPage'

import { ProfessionalOverview } from '@/pages/professional/ProfessionalOverview'
import { ProfessionalDiagnosisPage } from '@/pages/professional/ProfessionalDiagnosisPage'
import { ProfessionalRisksPage } from '@/pages/professional/ProfessionalRisksPage'
import { ProfessionalActionPlansPage } from '@/pages/professional/ProfessionalActionPlansPage'
import { ProfessionalCasesPage } from '@/pages/professional/ProfessionalCasesPage'

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        {/* Público */}
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/unauthorized" element={<UnauthorizedPage />} />

                        {/* Redireciona para dashboard por role */}
                        <Route
                            path="/app"
                            element={
                                <ProtectedRoute>
                                    <DashboardRouter />
                                </ProtectedRoute>
                            }
                        />

                        {/* Genesis */}
                        <Route
                            path="/dashboard/genesis"
                            element={
                                <ProtectedRoute allowedRoles={['genesis']}>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<GenesisOverview />} />
                            <Route path="organizations" element={<OrganizationsPage />} />
                            <Route path="users" element={<UsersPage />} />
                            <Route path="diagnosis" element={<DiagnosisPage />} />
                            <Route path="action-plans" element={<ActionPlansPage />} />
                            <Route path="crm" element={<CrmPage />} />
                            <Route path="finance" element={<FinancePage />} />
                            <Route path="audit" element={<AuditPage />} />
                        </Route>

                        {/* Cliente Executivo */}
                        <Route
                            path="/dashboard/client"
                            element={
                                <ProtectedRoute allowedRoles={['client_executive']}>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<ClientOverview />} />
                            <Route path="diagnosis" element={<ClientDiagnosisPage />} />
                            <Route path="risks" element={<ClientRisksPage />} />
                            <Route path="action-plans" element={<ClientActionPlansPage />} />
                            <Route path="documents" element={<ClientDocumentsPage />} />
                            <Route path="trainings" element={<ClientTrainingsPage />} />
                            <Route path="pulse" element={<ClientPulsePage />} />
                        </Route>

                        {/* Colaborador */}
                        <Route
                            path="/dashboard/collaborator"
                            element={
                                <ProtectedRoute allowedRoles={['collaborator']}>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<CollaboratorOverview />} />
                            <Route path="survey" element={<CollaboratorSurveyPage />} />
                            <Route path="privacy" element={<CollaboratorPrivacyPage />} />
                        </Route>

                        {/* Profissional */}
                        <Route
                            path="/dashboard/professional"
                            element={
                                <ProtectedRoute allowedRoles={['professional']}>
                                    <DashboardLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<ProfessionalOverview />} />
                            <Route path="diagnosis" element={<ProfessionalDiagnosisPage />} />
                            <Route path="risks" element={<ProfessionalRisksPage />} />
                            <Route path="action-plans" element={<ProfessionalActionPlansPage />} />
                            <Route path="cases" element={<ProfessionalCasesPage />} />
                        </Route>

                        {/* 404 */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
            </BrowserRouter>

            {env.isDev && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
    )
}

