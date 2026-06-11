import React from 'react';
import { Button, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Textarea } from '@blinkdotnew/ui';
import { Send } from 'lucide-react';

interface TripInquiryFormProps {
  initialTripType?: string;
  onSuccess?: () => void;
  showTitle?: boolean;
}

export const TripInquiryForm: React.FC<TripInquiryFormProps> = ({ 
  initialTripType, 
  onSuccess,
  showTitle = true 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    if (onSuccess) onSuccess();
  };

  return (
    <div className="space-y-6">
      {showTitle && <h3 className="text-3xl font-display font-black uppercase italic mb-8 tracking-tight">Plan My Trip</h3>}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
            <Input placeholder="John Doe" className="bg-white h-12 rounded-xl border-none shadow-sm" required />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile</label>
            <Input placeholder="0400 000 000" className="bg-white h-12 rounded-xl border-none shadow-sm" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
          <Input type="email" placeholder="john@example.com" className="bg-white h-12 rounded-xl border-none shadow-sm" required />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Trip Type</label>
            <Select defaultValue={initialTripType}>
              <SelectTrigger className="bg-white h-12 rounded-xl border-none shadow-sm">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="golf">Golf Weekend</SelectItem>
                <SelectItem value="fishing">Fishing Trip</SelectItem>
                <SelectItem value="bucks">Bucks Party</SelectItem>
                <SelectItem value="custom">Custom Trip</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Group Size</label>
            <Select>
              <SelectTrigger className="bg-white h-12 rounded-xl border-none shadow-sm">
                <SelectValue placeholder="Select size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4-8">4-8 blokes</SelectItem>
                <SelectItem value="8-16">8-16 blokes</SelectItem>
                <SelectItem value="16-24">16-24 blokes</SelectItem>
                <SelectItem value="24+">24+ blokes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Anything Else?</label>
          <Textarea placeholder="Tell us about preferred dates, locations, or special requests..." className="bg-white rounded-xl border-none shadow-sm min-h-[120px]" />
        </div>

        <Button type="submit" className="w-full h-16 bg-accent text-primary hover:bg-primary hover:text-white border-none font-black uppercase italic tracking-tight text-lg shadow-xl shadow-accent/20 transition-all duration-300">
          Send Enquiry <Send className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest">
          By submitting you agree to our Terms & Conditions.
        </p>
      </form>
    </div>
  );
};
