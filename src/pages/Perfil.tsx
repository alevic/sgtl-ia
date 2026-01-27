import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { User, Shield, Settings, Activity } from 'lucide-react';
import { Tabs } from '../components/ui/tabs-custom';
import { UserProfileForm } from '../components/User/UserProfileForm';
import { UserSecurityPanel } from '../components/User/UserSecurityPanel';
import { UserPreferences } from '../components/User/UserPreferences';
import { UserActivityLog } from '../components/User/UserActivityLog';

export const Perfil: React.FC = () => {
    const { user } = useApp();
    const [activeTab, setActiveTab] = useState('profile');

    // Persist tab in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && ['profile', 'security', 'preferences', 'activity'].includes(tab)) {
            setActiveTab(tab);
        }
    }, []);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
    };

    const tabs = [
        { value: 'profile', label: 'Perfil', icon: <User size={16} /> },
        { value: 'security', label: 'Segurança', icon: <Shield size={16} /> },
        { value: 'preferences', label: 'Preferências', icon: <Settings size={16} /> },
        { value: 'activity', label: 'Atividades', icon: <Activity size={16} /> },
    ];

    return (
        <div key="perfil-main" className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Meu Perfil</h1>
                <p className="text-slate-500 dark:text-slate-400">Gerencie suas informações e preferências</p>
            </div>

            {/* Tabs */}
            <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'profile' && (
                    <div className="max-w-4xl">
                        <UserProfileForm
                            userId={user.id}
                            showAvatar={true}
                            canEditRole={false}
                            canEditUsername={false}
                            showNotes={false}
                            showIsActive={false}
                            isCurrentUser={true}
                        />
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="max-w-4xl">
                        <UserSecurityPanel userId={user.id} />
                    </div>
                )}

                {activeTab === 'preferences' && (
                    <div className="max-w-4xl">
                        <UserPreferences userId={user.id} />
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="max-w-4xl">
                        <UserActivityLog userId={user.id} />
                    </div>
                )}
            </div>
        </div>
    );
};
