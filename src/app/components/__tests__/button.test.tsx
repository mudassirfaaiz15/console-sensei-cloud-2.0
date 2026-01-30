import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Button } from '@/app/components/ui/button';

describe('Button', () => {
    it('renders button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders disabled button', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies variant classes', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('bg-destructive');
    });

    it('applies size classes', () => {
        render(<Button size="lg">Large Button</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('h-10');
    });
});
