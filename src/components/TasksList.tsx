
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Clock, Target, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Task {
  id: string;
  task_number: number;
  task_completed: boolean;
  earnings: number;
  reward_amount: number;
  available_at: string;
  task_date: string;
}

export const TasksList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [hasDeposit, setHasDeposit] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      checkUserDeposit();
      fetchTasks();
    }
  }, [user]);

  const checkUserDeposit = async () => {
    try {
      const { data, error } = await supabase
        .from('deposits')
        .select('id')
        .eq('user_id', user?.id)
        .eq('status', 'approved')
        .limit(1);

      if (error) throw error;
      setHasDeposit(data && data.length > 0);
    } catch (error) {
      console.error('Error checking deposits:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('user_id', user?.id)
        .eq('task_date', today)
        .order('task_number');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setCompletingTask(taskId);
    
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Simulate task completion with earnings
      const earnings = Math.random() * (task.reward_amount - 1) + 1;
      
      const { error } = await supabase
        .from('daily_tasks')
        .update({
          task_completed: true,
          earnings: earnings
        })
        .eq('id', taskId);

      if (error) throw error;

      // Get current profile data
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('current_balance, total_profit')
        .eq('id', user?.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return;
      }

      // Update user's balance and total profit
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          current_balance: (profileData.current_balance || 0) + earnings,
          total_profit: (profileData.total_profit || 0) + earnings
        })
        .eq('id', user?.id);

      if (profileError) {
        console.error('Error updating balance:', profileError);
      }

      // Record profit
      await supabase
        .from('profits')
        .insert({
          user_id: user?.id,
          amount: earnings,
          level_at_time: 'bronze' as const,
          profit_date: new Date().toISOString().split('T')[0]
        });

      toast({
        title: "Task Completed!",
        description: `You earned $${earnings.toFixed(2)} for completing this task.`,
      });

      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingTask(null);
    }
  };

  const getCompletedTasks = () => tasks.filter(t => t.task_completed).length;
  const getTotalEarnings = () => tasks.reduce((sum, t) => sum + (t.earnings || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show warning if user hasn't made a deposit
  if (!hasDeposit) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500" />
              <h3 className="text-xl font-semibold text-gray-900">Access Required</h3>
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  To view your daily tasks, log in to our system, select your level and make the deposit.
                </AlertDescription>
              </Alert>
              <p className="text-gray-600 max-w-md mx-auto">
                Choose your investment level and make a deposit to start earning daily profits through our task system.
              </p>
              <div className="flex gap-4 justify-center mt-6">
                <Button onClick={() => window.location.hash = '#deposit'} className="bg-blue-600 hover:bg-blue-700">
                  Make a Deposit
                </Button>
                <Button variant="outline" onClick={() => window.location.hash = '#levels'}>
                  View Levels
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tasks Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedTasks()}/{tasks.length}</div>
            <Progress value={(getCompletedTasks() / tasks.length) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${getTotalEarnings().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => !t.task_completed).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Tasks</CardTitle>
          <CardDescription>
            Complete your daily tasks to earn profits. New tasks are available every day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks available</h3>
              <p className="text-gray-600">
                Tasks will be generated based on your deposit level.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    task.task_completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      task.task_completed ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {task.task_completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium">Task #{task.task_number}</h4>
                      <p className="text-sm text-gray-600">
                        {task.task_completed 
                          ? `Completed - Earned $${task.earnings?.toFixed(2)}` 
                          : `Reward: Up to $${task.reward_amount}`
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.task_completed ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Completed
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => completeTask(task.id)}
                        disabled={completingTask === task.id}
                        size="sm"
                      >
                        {completingTask === task.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Complete Task
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
