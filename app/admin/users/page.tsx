import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { ArrowLeft, User, Mail, Calendar, Shield, Edit, Eye, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default async function AdminUsersPage() {
    const supabase = await createClient()

    // Check if user is admin
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
        redirect("/auth/login")
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
        redirect("/dashboard")
    }

    // Use service-role client to bypass RLS for admin-only listing
    const admin = createAdminClient()

    const { data: users, error: usersError } = await admin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

    let usersWithBookings = users || []
    if (users && users.length > 0) {
        const userIds = users.map((u) => u.id)
        const { data: bookings } = await admin
            .from("bookings")
            .select("id, user_id, status, total_amount")
            .in("user_id", userIds)

        usersWithBookings = users.map((user) => ({
            ...user,
            bookings: bookings?.filter((booking) => booking.user_id === user.id) || [],
        }))
    }

    if (usersError) {
        console.error("[v0] Error fetching users:", usersError)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost" className="mb-4">
                        <Link href="/admin">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Admin Dashboard
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                        <p className="text-muted-foreground">Manage all user accounts and permissions</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>{usersWithBookings?.length || 0} registered users in the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usersError && (
                            <div className="text-red-500 p-4 bg-red-50 rounded-lg mb-4">
                                Error loading users: {usersError.message}
                            </div>
                        )}

                        {!usersWithBookings || usersWithBookings.length === 0 ? (
                            <div className="text-center py-8">
                                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No users found</h3>
                                <p className="text-muted-foreground">There are no registered users in the system yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Bookings</TableHead>
                                            <TableHead>Total Spent</TableHead>
                                            <TableHead>Joined</TableHead>
                                            <TableHead className="w-[70px]">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {usersWithBookings.map((userProfile) => {
                                            const totalSpent =
                                                userProfile.bookings?.reduce((sum: any, booking: { total_amount: any }) => sum + (booking.total_amount || 0), 0) || 0
                                            const activeBookings = userProfile.bookings?.filter((b: { status: string }) => b.status === "confirmed").length || 0

                                            return (
                                                <TableRow key={userProfile.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{userProfile.full_name || "No name provided"}</div>
                                                                <div className="text-sm text-muted-foreground">ID: {userProfile.id.slice(0, 8)}...</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-1 text-sm">
                                                                <Mail className="h-3 w-3" />
                                                                <span>{userProfile.email}</span>
                                                            </div>
                                                            {userProfile.phone && (
                                                                <div className="text-sm text-muted-foreground">{userProfile.phone}</div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={userProfile.role === "admin" ? "default" : "secondary"}>
                                                            <Shield className="h-3 w-3 mr-1" />
                                                            {userProfile.role === "admin" ? "Administrator" : "Customer"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div>Total: {userProfile.bookings?.length || 0}</div>
                                                            <div className="text-muted-foreground">Active: {activeBookings}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">${totalSpent.toLocaleString()}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{new Date(userProfile.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/admin/users/${userProfile.id}`}>
                                                                        <Eye className="h-4 w-4 mr-2" />
                                                                        View Details
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem asChild>
                                                                    <Link href={`/admin/users/${userProfile.id}/edit`}>
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                        Edit User
                                                                    </Link>
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
