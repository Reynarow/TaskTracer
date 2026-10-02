"use client";

import { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { PersianDatePickerInput } from "@/components/persian-datepicker";
import {
  Plus,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ListTodo,
  TrendingUp,
  CalendarDays,
  Edit3,
  Sparkles,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";

export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  category: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  description?: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "پیاده‌سازی صفحه لاگین",
    category: "برنامه‌نویسی",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-10-07",
    createdAt: "2026-10-01",
    description: "طراحی و پیاده‌سازی صفحه ورود کاربران با اعتبارسنجی فرم",
  },
  {
    id: "2",
    title: "طراحی کامپوننت‌های شادسی‌ان",
    category: "طراحی UI",
    status: "completed",
    priority: "medium",
    dueDate: "2026-10-03",
    createdAt: "2026-09-28",
    description: "ساخت کامپوننت‌های قابل استفاده مجدد با Shadcn",
  },
  {
    id: "3",
    title: "بررسی مستندات Tailwind v4",
    category: "یادگیری",
    status: "pending",
    priority: "low",
    dueDate: "2026-10-10",
    createdAt: "2026-10-02",
    description: "مطالعه تغییرات جدید تیلویند نسخه ۴",
  },
  {
    id: "4",
    title: "بهینه‌سازی عملکرد API",
    category: "بک‌اند",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-10-05",
    createdAt: "2026-10-01",
    description: "کاهش زمان پاسخ و بهینه‌سازی کوئری‌ها",
  },
  {
    id: "5",
    title: "نوشتن تست‌های واحد",
    category: "تست",
    status: "pending",
    priority: "medium",
    dueDate: "2026-10-12",
    createdAt: "2026-10-02",
    description: "پوشش تست برای ماژول‌های اصلی پروژه",
  },
];

const STORAGE_KEY = "next_task_tracker_tasks";
const emptySubscribe = () => () => {};

/* ──── Stat Card Component ──── */
function StatCard({
  icon: Icon,
  label,
  count,
  total,
  accentClass,
  gradient,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  total: number;
  accentClass: string;
  gradient: string;
  delay: number;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      className={`glass-card rounded-2xl p-5 ${accentClass} animate-float-in hover:scale-[1.03] transition-transform duration-300 cursor-default`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${gradient}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-3xl font-bold animate-count-up">{count}</span>
      </div>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      <div className="progress-bar mt-3">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {percentage}% از کل تسک‌ها
      </p>
    </div>
  );
}

/* ──── Main Component ──── */
export default function TaskTracker() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // مقداردهی اولیه تسک‌ها از localStorage به صورت Lazy
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit mode
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Save tasks to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, isMounted]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCategory.trim() || "عمومی",
      status: "pending",
      priority: newPriority,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      description: newDescription || undefined,
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewCategory("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewDescription("");
    setIsOpen(false);
    toast.success("تسک با موفقیت اضافه شد ✨");
  };

  const handleEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setTasks(
      tasks.map((t) => (t.id === editingTask.id ? { ...editingTask } : t))
    );
    setIsEditOpen(false);
    setEditingTask(null);
    toast.success("تسک با موفقیت ویرایش شد ✏️");
  };

  const openEditDialog = (task: Task) => {
    setEditingTask({ ...task });
    setIsEditOpen(true);
  };

  const handleStatusChange = (id: string, nextStatus: TaskStatus) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    );

    const statusLabels: Record<TaskStatus, string> = {
      pending: "در انتظار",
      "in-progress": "در حال انجام",
      completed: "تکمیل شده",
    };
    toast.info(`وضعیت تسک به «${statusLabels[nextStatus]}» تغییر کرد`);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    toast.error("تسک حذف شد 🗑️");
  };

  // Filtered + searched tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchStatus =
        filterStatus === "all" || task.status === filterStatus;
      const matchSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description &&
          task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStatus && matchSearch;
    });
  }, [tasks, filterStatus, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const inProgress = tasks.filter((t) => t.status === "in-progress").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 px-3 py-1">
            <CheckCircle className="w-3.5 h-3.5" /> تکمیل شده
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 px-3 py-1">
            <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} /> در حال انجام
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 gap-1.5 px-3 py-1">
            <AlertCircle className="w-3.5 h-3.5" /> در انتظار
          </Badge>
        );
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 px-3 py-1">
            <Zap className="w-3 h-3" /> فوری
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30 gap-1 px-3 py-1">
            <Target className="w-3 h-3" /> متوسط
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 gap-1 px-3 py-1">
            <Sparkles className="w-3 h-3" /> عادی
          </Badge>
        );
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
  };

  const priorityLabels = {
    low: "عادی",
    medium: "متوسط",
    high: "فوری",
  };

  if (!isMounted) return null; // Avoid SSR hydration mismatches with localStorage

  return (
    <div className="min-h-screen hero-gradient py-6 px-4 sm:px-6 lg:px-8 dir-rtl">
      <main className="max-w-6xl mx-auto space-y-6">
        {/* ──── Hero Header ──── */}
        <div className="animate-float-in glass-card rounded-3xl p-8 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-fuchsia-500/10 dark:bg-fuchsia-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <ListTodo className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold gradient-text">
                  مدیریت تسک‌ها و پروژه‌ها
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  کارهای روزمره خود را دسته‌بندی، پیگیری و مدیریت کنید
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger>
                  <Button className="gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300 px-5">
                    <Plus className="w-4 h-4" /> افزودن تسک
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md" dir="rtl">
                  <DialogHeader className="text-right">
                    <DialogTitle className="flex items-center gap-2 mr-4">
                      
                      افزودن تسک جدید
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddTask} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground ">
                        عنوان تسک
                      </label>
                      <Input
                        className="mt-2"
                        placeholder="مثلاً: طراحی داشبورد"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        توضیحات (اختیاری)
                      </label>
                      <Input
                        className="mt-2"
                        placeholder="توضیح کوتاه درباره تسک"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          دسته‌بندی
                        </label>
                        <Input
                          className="mt-2"
                          placeholder="مثلاً: فرانت‌اند"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          تاریخ سررسید
                        </label>
                        <PersianDatePickerInput
                          value={newDueDate}
                          onChange={setNewDueDate}
                          placeholder="انتخاب تاریخ سررسید"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        اولویت
                      </label>
                      <Select
                        value= { newPriority}
                        onValueChange={(val) => {
                          if (val) setNewPriority(val as TaskPriority);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="انتخاب اولویت" >
                            
                            {newPriority ? priorityLabels[newPriority] : "انتخاب اولویت"}                             
                            </SelectValue>
                          
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value= "low">عادی</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="high">فوری</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="w-full mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white"
                    >
                      <Plus className="w-4 h-4 ml-2" />
                      ذخیره تسک
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* ──── Stats Cards ──── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            icon={BarChart3}
            label="کل تسک‌ها"
            count={stats.total}
            total={stats.total}
            accentClass="stat-card-violet"
            gradient="bg-gradient-to-br from-violet-600 to-violet-400"
            delay={0}
          />
          <StatCard
            icon={AlertCircle}
            label="در انتظار"
            count={stats.pending}
            total={stats.total}
            accentClass="stat-card-amber"
            gradient="bg-gradient-to-br from-amber-500 to-amber-400"
            delay={80}
          />
          <StatCard
            icon={TrendingUp}
            label="در حال انجام"
            count={stats.inProgress}
            total={stats.total}
            accentClass="stat-card-rose"
            gradient="bg-gradient-to-br from-rose-500 to-rose-400"
            delay={160}
          />
          <StatCard
            icon={CheckCircle}
            label="تکمیل شده"
            count={stats.completed}
            total={stats.total}
            accentClass="stat-card-emerald"
            gradient="bg-gradient-to-br from-emerald-500 to-emerald-400"
            delay={240}
          />
        </div>

        {/* ──── Search + Filter ──── */}
        <div
          className="animate-float-in glass-card rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          style={{ animationDelay: "200ms" }}
        >
          <Tabs
            defaultValue="all"
            onValueChange={setFilterStatus}
            dir="rtl"
          >
            <TabsList className="rounded-xl ">
              <TabsTrigger value="all" className="rounded-lg gap-1">
                همه 
              </TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg gap-1">
                در انتظار 
              </TabsTrigger>
              <TabsTrigger value="in-progress" className="rounded-lg gap-1">
                در حال انجام 
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg gap-1">
                تکمیل شده 
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="جستجوی تسک..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 rounded-xl"
            />
          </div>
        </div>

        {/* ──── Data Table ──── */}
        <div
          className="animate-float-in glass-card rounded-2xl overflow-hidden"
          style={{ animationDelay: "300ms" }}
        >
          <Table className="overflow-hidden" >
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-right font-semibold">
                  عنوان تسک
                </TableHead>
                <TableHead className="text-right font-semibold">
                  دسته‌بندی
                </TableHead>
                <TableHead className="text-right font-semibold">
                  اولویت
                </TableHead>
                <TableHead className="text-right font-semibold">
                  وضعیت
                </TableHead>
                <TableHead className="text-right font-semibold">
                  <CalendarDays className="w-4 h-4 inline ml-1" />
                  سررسید
                </TableHead>
                <TableHead className="text-left font-semibold">
                  عملیات
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="stagger-children  ">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className={`animate-float-in transition-colors duration-200 group  ${
                      task.status === "completed"
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`font-semibold ${
                            task.status === "completed"
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-xs text-muted-foreground line-clamp-1 max-w-[340px]">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg px-3 py-0.5"
                      >
                        {task.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <span
                        className={`text-sm ${
                          isOverdue(task)
                            ? "text-rose-500 font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isOverdue(task) && "⚠️ "}
                        {formatDate(task.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="min-w-[200px] rounded-xl"
                          align="end"
                        >
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() => openEditDialog(task)}
                          >
                            <Edit3 className="w-4 h-4" /> ویرایش تسک
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() =>
                              handleStatusChange(task.id, "pending")
                            }
                          >
                            <AlertCircle className="w-4 h-4" /> تغییر به در
                            انتظار
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() =>
                              handleStatusChange(task.id, "in-progress")
                            }
                          >
                            <Clock className="w-4 h-4" /> تغییر به در حال
                            انجام
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 rounded-lg"
                            onClick={() =>
                              handleStatusChange(task.id, "completed")
                            }
                          >
                            <CheckCircle className="w-4 h-4" /> تغییر به تکمیل
                            شده
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer gap-2 rounded-lg"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" /> حذف تسک
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-16 text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <ListTodo className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium">
                        هیچ تسکی در این بخش وجود ندارد
                      </p>
                      <p className="text-sm">
                        از دکمه «افزودن تسک» برای ساخت تسک جدید استفاده کنید
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ──── Footer ──── */}
        <div className="animate-float-in text-center py-4" style={{ animationDelay: "400ms" }}>
          <p className="text-xs text-muted-foreground">
           
          </p>
        </div>

        {/* ──── Edit Dialog ──── */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader className="text-right">
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-violet-500" />
                ویرایش تسک
              </DialogTitle>
            </DialogHeader>
            {editingTask && (
              <form onSubmit={handleEditTask} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    عنوان تسک
                  </label>
                  <Input
                    className="mt-2"
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    توضیحات
                  </label>
                  <Input
                    className="mt-2"
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      دسته‌بندی
                    </label>
                    <Input
                      className="mt-2"
                      value={editingTask.category}
                      onChange={(e) =>
                        setEditingTask({
                          ...editingTask,
                          category: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      تاریخ سررسید
                    </label>
                    <PersianDatePickerInput
                      value={editingTask.dueDate || ""}
                      onChange={(val) =>
                        setEditingTask({
                          ...editingTask,
                          dueDate: val,
                        })
                      }
                      placeholder="انتخاب تاریخ سررسید"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      اولویت
                    </label>
                    <Select
                      value={editingTask.priority}
                      onValueChange={(val) => {
                        if (val) setEditingTask({ ...editingTask, priority: val as TaskPriority });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="low">عادی</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="high">فوری</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      وضعیت
                    </label>
                    <Select
                      value={editingTask.status}
                      onValueChange={(val) => {
                        if (val) setEditingTask({ ...editingTask, status: val as TaskStatus });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="in-progress">
                          در حال انجام
                        </SelectItem>
                        <SelectItem value="completed">تکمیل شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 hover:from-violet-700 hover:to-fuchsia-600 text-white"
                >
                  <Edit3 className="w-4 h-4 ml-2" />
                  ذخیره تغییرات
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}