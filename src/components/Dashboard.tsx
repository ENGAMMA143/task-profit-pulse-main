import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  Wallet, 
  Target, 
  Star, 
  LogOut,
  Plus,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  BarChart3,
  Smartphone,
  Moon,
  Sun
} from 'lucide-react';
import { DepositForm } from './DepositForm';
import { TasksList } from './TasksList';
import { WithdrawForm } from './WithdrawForm';

interface Profile {
  id: string;
  username: string;
  email: string;
  current_balance: number;
  current_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  total_deposited: number;
  total_profit: number;
}

interface Level {
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  min_deposit: number;
  max_deposit: number;
  tasks_per_day: number;
  min_daily_earning: number;
  max_daily_earning: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLevelForUpgrade, setSelectedLevelForUpgrade] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLevels();
    }
  }, [user]);

  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('*')
        .order('min_deposit', { ascending: true });

      if (error) throw error;
      setLevels(data);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'from-orange-400 to-orange-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-400 to-purple-600';
      default: return 'from-orange-400 to-orange-600';
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'silver': return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
      case 'gold': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      case 'platinum': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default: return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
    }
  };

  const getCurrentLevel = () => levels.find(l => l.level === profile?.current_level);

  const handleLevelUpgrade = (levelName: string) => {
    setSelectedLevelForUpgrade(levelName);
    setActiveTab('deposit');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <div className="absolute inset-2 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-white text-lg font-medium">Loading your investment dashboard...</p>
          <p className="text-blue-200 text-sm mt-2">Preparing your financial data</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="relative">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TaskProfit
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {profile?.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="rounded-full p-2"
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Badge className={`${getLevelBadgeColor(profile?.current_level || 'bronze')} px-3 py-1 text-xs font-semibold`}>
                {profile?.current_level?.toUpperCase()}
              </Badge>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-gray-600 dark:text-gray-400">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: 'url(/hero-bg.jpg)' }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Investment Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track, grow, and manage your wealth with confidence
            </p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${profile?.current_balance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${profile?.total_profit?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Invested</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      ${profile?.total_deposited?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Level</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {profile?.current_level || 'Bronze'}
                    </p>
                  </div>
                  <div className={`h-12 w-12 bg-gradient-to-r ${getLevelColor(profile?.current_level || 'bronze')} rounded-xl flex items-center justify-center`}>
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Mobile-Optimized Tab Navigation */}
          <div className="sticky top-20 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl p-2 mb-6 shadow-lg">
            <TabsList className="grid w-full grid-cols-5 bg-transparent gap-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs">Overview</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span className="text-xs">Tasks</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="deposit"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1">
                  <ArrowUpRight className="h-4 w-4" />
                  <span className="text-xs">Deposit</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="withdraw"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1">
                  <ArrowDownLeft className="h-4 w-4" />
                  <span className="text-xs">Withdraw</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="levels"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="text-xs">Levels</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            {/* Level Progress Card */}
            {getCurrentLevel() && (
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`h-8 w-8 bg-gradient-to-r ${getLevelColor(profile?.current_level || 'bronze')} rounded-lg flex items-center justify-center`}>
                      <Star className="h-4 w-4 text-white" />
                    </div>
                    Current Level Progress
                  </CardTitle>
                  <CardDescription>
                    You're on the {profile?.current_level?.toUpperCase()} investment tier
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Daily Earnings</span>
                      </div>
                      <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        ${getCurrentLevel()?.min_daily_earning} - ${getCurrentLevel()?.max_daily_earning}
                      </div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-900 dark:text-green-100">Daily Tasks</span>
                      </div>
                      <div className="text-lg font-bold text-green-900 dark:text-green-100">
                        {getCurrentLevel()?.tasks_per_day}
                      </div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Investment Range</span>
                      </div>
                      <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        ${getCurrentLevel()?.min_deposit} - ${getCurrentLevel()?.max_deposit}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card 
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setActiveTab('deposit')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Make Deposit</h3>
                      <p className="text-blue-100 text-sm">Add funds to start earning</p>
                    </div>
                    <img src="/deposit-icon.png" alt="Deposit" className="h-12 w-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setActiveTab('withdraw')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Withdraw</h3>
                      <p className="text-green-100 text-sm">Cash out your profits</p>
                    </div>
                    <img src="/withdraw-icon.png" alt="Withdraw" className="h-12 w-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => setActiveTab('tasks')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Daily Tasks</h3>
                      <p className="text-purple-100 text-sm">Complete and earn rewards</p>
                    </div>
                    <img src="/tasks-icon.png" alt="Tasks" className="h-12 w-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <TasksList />
          </TabsContent>

          <TabsContent value="deposit">
            <DepositForm 
              onDepositSuccess={fetchProfile} 
              selectedLevel={selectedLevelForUpgrade || undefined} 
            />
          </TabsContent>

          <TabsContent value="withdraw">
            <WithdrawForm currentBalance={profile?.current_balance || 0} />
          </TabsContent>

          <TabsContent value="levels" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {levels.map((level) => (
                <Card 
                  key={level.level} 
                  className={`${
                    profile?.current_level === level.level 
                      ? 'ring-2 ring-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20' 
                      : 'bg-white/70 dark:bg-gray-800/70'
                  } backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 bg-gradient-to-r ${getLevelColor(level.level)} rounded-lg flex items-center justify-center`}>
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <span className="capitalize">{level.level} Level</span>
                      </div>
                      {profile?.current_level === level.level && (
                        <Badge className="bg-green-500 text-white">Current</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Investment Range</span>
                        <span className="text-sm font-semibold">${level.min_deposit} - ${level.max_deposit}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Daily Tasks</span>
                        <span className="text-sm font-semibold">{level.tasks_per_day}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Daily Earnings</span>
                        <span className="text-sm font-semibold">${level.min_daily_earning} - ${level.max_daily_earning}</span>
                      </div>
                    </div>
                    {profile?.current_level !== level.level && (
                      <Button 
                        className={`w-full bg-gradient-to-r ${getLevelColor(level.level)} text-white hover:opacity-90 transition-opacity`}
                        onClick={() => handleLevelUpgrade(level.level)}
                      >
                        Upgrade to {level.level}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

