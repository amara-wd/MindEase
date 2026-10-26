# MindEase — Make Time for Yourself

**A personal well-being and activity planner for students, developers, and busy professionals.**

[**Live Demo**](https://my-mindease.netlify.app/) · [**GitHub Repository**](https://github.com/amara-wd/MindEase)

## About MindEase

In a world full of assignments, deadlines, coding sessions, and work responsibilities, people often forget to make time for themselves.

MindEase is a web application designed to help people intentionally schedule personal activities, reflect on their experiences, and build more mindful routines.

Instead of focusing only on getting more work done, MindEase encourages users to give rest, enjoyment, and personal growth a place in their schedules.

**Our philosophy:** You make time for your work. Make time for yourself, too.

## The Problem

Students, developers, and working professionals often prioritize their responsibilities while postponing breaks, hobbies, and activities they enjoy.

Even when people recognize the importance of personal well-being, they may struggle to plan time for themselves or reflect on how their everyday activities make them feel.

Most productivity routines emphasize completing tasks. MindEase takes a different approach by helping users plan personal activities and learn from their experiences.

## Our Solution

MindEase offers a structured activity-planning experience that helps users:

- Plan personal activities throughout the week.
- Predict how enjoyable or meaningful an activity might be.
- Record their actual experience after completing it.
- Review weekly progress and reflect on their activity patterns.

The goal is to make personal well-being a more intentional part of everyday life.

## Features

### Activity Planning

- Create, edit, and delete activities.
- Schedule activities by date and time.
- Navigate a weekly planner.

### Pleasure and Mastery

- Categorize activities as Pleasure, Mastery, or Both.
- Rate expected pleasure and mastery before an activity.
- Reflect on actual pleasure and mastery afterward.

### Activity Reflection

- Mark activities as completed or skipped.
- Record actual ratings and optional notes.
- Add reasons for skipping activities.
- Reschedule activities when plans change.

### Weekly Insights

- Review activity completion rates.
- Explore average pleasure and mastery ratings.
- Compare expected ratings with actual experiences.

### Local Storage

- Save activities and related reflection data in the browser's local storage.
- Retain saved activities across page reloads in the same browser.
- Use the activity planner without requiring a database or user account.

### Future Database Integration

MindEase currently uses browser local storage to keep the activity planner simple and functional without a backend database.

Database integration is planned for a future version. The goal is to support more persistent data storage and potentially allow users to access their activities across multiple devices. Features such as account-based access and synchronization will depend on the future implementation.

## How It Works

1. **Plan:** Schedule an activity for yourself.
2. **Predict:** Estimate how enjoyable or meaningful it will be.
3. **Participate:** Make time for the activity.
4. **Reflect:** Record how the experience actually felt.
5. **Review:** Use weekly insights to understand your activity patterns.

## Who Is It For?

- **Students** balancing studies, assignments, and personal time.
- **Developers** who spend long hours coding.
- **Professionals** managing busy schedules.
- **Anyone** who wants to make more intentional time for personal activities.

## Technology Stack

- **React** — Building the user interface.
- **TypeScript** — Type-safe application development.
- **Vite** — Development server and build tooling.
- **Tailwind CSS** — Styling and layout.
- **Lucide React** — Interface icons.
- **Browser Local Storage** — Saving activity data locally in the current version.

## Live Demo

Try MindEase here:

[https://my-mindease.netlify.app/](https://my-mindease.netlify.app/)

## Run Locally

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/amara-wd/MindEase.git
cd MindEase
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal.

## Data Storage and Privacy

The current version of MindEase stores activity data in the browser's local storage.

- Data remains associated with the browser and device where it was saved.
- Data is not automatically synchronized across devices.
- Clearing the browser's local storage may result in the loss of saved activity data.
- The current activity planner does not require a database account.

**Planned improvement:** A future version may integrate a database to support more persistent storage and additional capabilities. Database integration and any associated account or synchronization features are not yet implemented.

If additional features communicate with an external backend or AI service, their data handling should be documented separately.

## Project Purpose

MindEase aims to encourage intentional activity planning, personal reflection, and a healthier balance between work and personal time.

It is a well-being support tool, not a medical diagnostic service.

## Future Improvements

Potential enhancements include:

- Database integration for persistent data storage.
- Optional user accounts and secure authentication.
- Cross-device activity access and synchronization.
- Optional reminders for planned activities.
- More detailed activity insights and visualizations.
- Personalized activity suggestions.
- An optional AI Companion for supportive conversations and activity ideas, if implemented.

## Contributing

Contributions, suggestions, and bug reports are welcome.

1. Fork the repository.
2. Create a branch for your changes.
3. Implement and test your changes.
4. Submit a pull request describing your contribution.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.