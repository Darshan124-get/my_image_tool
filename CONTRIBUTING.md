# Contributing to MyImageTool

Thank you for your interest in contributing to MyImageTool! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

1. Check if the feature has already been suggested
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Potential implementation approach (if you have ideas)

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Test thoroughly (see Testing section in README)
5. Commit with clear messages: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/your-feature-name`
7. Open a Pull Request

### Commit Message Format

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Development Guidelines

### Code Style

- Use ES6+ JavaScript features
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

### Browser Compatibility

- Test in Chrome, Firefox, and Safari
- Ensure mobile responsiveness
- Verify accessibility features

### Performance

- Keep bundle size minimal
- Use lazy loading for heavy libraries
- Optimize image processing operations
- Test with large files

### Privacy & Security

- Never add code that uploads files to servers
- Maintain client-side processing only
- Don't add tracking without user consent
- Keep dependencies up to date

## Testing

Before submitting a PR, ensure:

- [ ] All manual test cases pass (see README)
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Accessibility features work (keyboard navigation, screen readers)
- [ ] No network uploads occur (verify in DevTools)

## Questions?

Feel free to open an issue for questions or clarifications.

Thank you for contributing to MyImageTool!

