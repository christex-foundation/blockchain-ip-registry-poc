'use client'

import { useState } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Role is required',
  }),
})

type AddMemberFormData = z.infer<typeof addMemberSchema>

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  onSuccess?: () => void
}

export function AddMemberDialog({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: AddMemberDialogProps) {
  const { getAccessToken } = usePrivy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      userId: '',
      role: 'member',
    },
  })

  const onSubmit = async (data: AddMemberFormData) => {
    try {
      setIsSubmitting(true)
      
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: data.userId,
          role: data.role,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add member')
      }

      const result = await response.json()
      
      toast.success('Member added successfully!', {
        description: `User has been added as ${data.role}`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error adding member:', error)
      
      if (error instanceof Error && error.message.includes('already a member')) {
        toast.error('User is already a member', {
          description: 'This user is already part of the organization',
        })
      } else {
        toast.error('Failed to add member', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] shadow-strong border border-gray-200 bg-white">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="h-10 w-10 bg-[#7073d1]/10 rounded-lg flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-[#7073d1]" />
            </div>
            Add Member
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-balance">
            Add a new member to this organization. They will be granted access to collaborate and will be verified on-chain as part of your organization's collection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">User ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="did:privy:clk..."
                        className="h-12 shadow-soft border border-gray-200 bg-white text-[#202020] font-mono text-sm focus:border-[#7073d1] focus:ring-[#7073d1]/20"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600">
                      The Privy user ID of the person to add. This typically starts with "did:privy:" followed by a unique identifier. You can find this in their profile or ask them to share it.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Member Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 shadow-soft border border-gray-200 bg-white text-[#202020] focus:border-[#7073d1] focus:ring-[#7073d1]/20">
                          <SelectValue placeholder="Select member role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-medium">
                        <SelectItem value="member">
                          <div className="flex items-center gap-3 py-2">
                            <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <UserPlus className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">Member</p>
                              <p className="text-xs text-gray-500">Can view and contribute to works</p>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-3 py-2">
                            <div className="h-8 w-8 bg-[#7073d1]/10 rounded-full flex items-center justify-center">
                              <UserPlus className="h-4 w-4 text-[#7073d1]" />
                            </div>
                            <div>
                              <p className="font-medium">Admin</p>
                              <p className="text-xs text-gray-500">Can manage members and organization settings</p>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-600">
                      Choose the appropriate role based on the level of access and responsibility this person should have within the organization.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t bg-gray-50 -mx-6 px-6 pb-6 mt-6">
              <div className="space-y-3 mb-6">
                <h4 className="font-medium flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#7073d1]" />
                  Member addition process
                </h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    Member will be added to organization database
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    On-chain verification will be created
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    Access permissions will be granted
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    Ready to collaborate on IP works
                  </li>
                </ul>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="bg-white shadow-soft border-gray-200 text-[#202020] hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#7073d1] hover:bg-[#5c5fb3] text-white shadow-medium hover:shadow-strong transition-all duration-200 hover:-translate-y-0.5 border-0"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}