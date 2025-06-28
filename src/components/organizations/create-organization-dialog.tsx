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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Building2, Loader2 } from 'lucide-react'

const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(255, 'Name too long'),
  type: z.enum(['publishing_company', 'individual_artist'], {
    required_error: 'Organization type is required',
  }),
  description: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>

interface CreateOrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (organization: any) => void
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const { getAccessToken } = usePrivy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
      type: 'publishing_company',
      description: '',
      imageUrl: '',
    },
  })

  const onSubmit = async (data: CreateOrganizationFormData) => {
    try {
      setIsSubmitting(true)
      
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          description: data.description || undefined,
          imageUrl: data.imageUrl || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create organization')
      }

      const result = await response.json()
      
      toast.success('Organization created successfully!', {
        description: `${data.name} has been created with on-chain collection`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess?.(result.organization)
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] shadow-strong border-0 bg-white">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="flex items-center gap-3 text-2xl text-[#202020]">
            <div className="h-10 w-10 bg-[#dcddff] rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-[#7073d1]" />
            </div>
            Create Organization
          </DialogTitle>
          <DialogDescription className="text-gray-600 text-balance">
            Create a new organization with an on-chain collection for collaborative intellectual property management. This will establish your organization on the Solana blockchain.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-[#202020]">Organization Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Publishing Company"
                        className="h-12 shadow-soft border border-gray-200 bg-white focus:border-[#7073d1] focus:ring-2 focus:ring-[#7073d1]/20"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 text-sm">
                      The public name that will represent your organization on-chain and in all collaborations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-[#202020]">Organization Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 shadow-soft border border-gray-200 bg-white focus:border-[#7073d1] focus:ring-2 focus:ring-[#7073d1]/20">
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-medium">
                        <SelectItem value="publishing_company" className="hover:bg-gray-50 focus:bg-gray-50">
                          <div className="flex items-center gap-2 py-1">
                            <Building2 className="h-4 w-4 text-[#7073d1]" />
                            <span className="text-[#202020]">Publishing Company</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="individual_artist" className="hover:bg-gray-50 focus:bg-gray-50">
                          <div className="flex items-center gap-2 py-1">
                            <Building2 className="h-4 w-4 text-[#7073d1]" />
                            <span className="text-[#202020]">Individual Artist</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-gray-600 text-sm">
                      This helps categorize your organization and enables appropriate features and workflows
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-[#202020]">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of your organization's mission and focus areas..."
                        className="resize-none shadow-soft border border-gray-200 bg-white focus:border-[#7073d1] focus:ring-2 focus:ring-[#7073d1]/20 min-h-[100px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 text-sm">
                      Help others understand your organization's purpose and specialization areas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-[#202020]">Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/your-logo.png"
                        type="url"
                        className="h-12 shadow-soft border border-gray-200 bg-white focus:border-[#7073d1] focus:ring-2 focus:ring-[#7073d1]/20"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-600 text-sm">
                      Provide a logo or image URL that will represent your organization visually
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-4 border-t border-gray-100 bg-gray-50 -mx-6 px-6 pb-6 mt-6">
              <div className="space-y-3 mb-6">
                <h4 className="font-medium flex items-center gap-2 text-[#202020]">
                  <Building2 className="h-4 w-4 text-[#7073d1]" />
                  What happens next?
                </h4>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    Organization will be created in our database
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    On-chain collection will be deployed to Solana
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    You'll be set as the organization owner
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-[#7073d1] rounded-full" />
                    Ready to add members and create IP works
                  </li>
                </ul>
              </div>

              <DialogFooter className="gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="shadow-soft border-gray-200 text-[#202020] hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="shadow-medium hover:shadow-strong transition-all duration-200 bg-gradient-to-r from-[#7073d1] to-[#5a5db8] hover:from-[#5a5db8] hover:to-[#4a4d9e] text-white"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Create Organization
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}