# LOOK.education Visual LMS

LOOK.education started in 2013 as a free, basic application that allowed parents and teachers to curate, organize and distribute select public videos to their children and students, for education or safe entertainment purposes. Ever since, new features were added such as video-quizzes, 360-degree videos and VR viewers, custom AR experiences, and collaborative learning functionalities. Over time, the interest in such a visual education platform grew from K-12 schools and after-school programs, to workforce education, higher-ed, corporate training, and specialized education and training programs, with virtually infinite applications for media and visual assets management and distribution. From students, apprentices, trainees, to companies employees, organizations members, and even further to families, celebrities, astronauts (yes, LOOK.education was a NASA iTech semifinalist in 2017) and so on, LOOK.education could create visual excitement and could enhance the teaching and learning for a wide variety of people and organizations. Since 2013, the name of the platform evolved from YoouKids, to [JuniorTube](https://github.com/nehloo/juniortube) EDU, and then to LOOK.education.

LOOK.education became an open-source platform in 2019, starting with a new base code developed from scratch for what was then called "Next-Gen LOOK.education", and with the intent to attract a community of developers that would contribute to build an open-source Visual LMS. Learning and teaching visually may be the future of education and training, for all individuals regardless of their age, race, ethnicity, geographical location, disability status (including visually impared) etc.

![LOOK.education](./public/img/look-education-sticker-600x121.png)

## Contributing to LOOK.education

First off, thank you for considering to contribute! 🎉

Follow the installation instruction below, then search for "TODO:" statements throughout the code to start your contribution.

Here are some first ideas that are next to be implemented on LOOK.education:
- Database-agnostic: could be installed locally and used with any type of database system, local or in the cloud
- User and roles management
- Support for more content provider integrations
- Layers of interactivity
- WebVR and WebAR
- Collaborative assignments
- Assessment management
- Grading tools (automated grading, assissted grading etc.)
- Data analytics and personalized reporting
- Handle microcredentials and certifications
- Your idea?...

Code of Conduct:
- This platform doesn't create or republish any kind of specific third-party content, such as, but not limited to, videos, virtual reality or augmented reality experiences, 3D models etc.
- This platform only helps curate, organize and distribute the third-party content made by, or licensed for, the third-party individuals or organizations that may use this platform.
- This platform may offer layers of interactivity added on top of third-party content that its users may own, but only if said layers of interactivity don't infringe any external terms of service imposed by the third-party service or content providers.

## Use cases
- Pre-K and K-12 schools
- Homeschooling
- Afterschool programs
- Workforce education and training
- Higher-ed
- Nonprofit awareness
- Public sector awareness or training
- Enterprise training

## Installation

```
cd PATH_TO_YOUR_LOCAL_APP_FOLDER
git clone https://github.com/nehloo/LOOK.education.git
npm i
```

### Create your own branch to change the code:

```
git branch experiment
```

### Install Parse Server locally:

Learn more about Parse Server: [parseplatform.org](https://parseplatform.org)

More details about installing Parse Server locally: https://github.com/parse-community/parse-server

### Create a new .env file and replace the values with your own info:

```
cd PATH_TO_YOUR_LOCAL_APP_FOLDER
nano .env
```

```
// .env file
VITE_APP_PARSE_SERVER_URL=http://domain_name.com/parse
VITE_APP_PARSE_SERVER_APP_ID=YOUR_APP_ID
```

### Run the app:

```
npm start
```

## Issues

Please log any issues to the main [repo](https://github.com/nehloo/LOOK.education/issues).

## LTI Tool Integrations

Create a configuration.xml file with the details of your LTI tool. [See an example here.](https://www.eduappcenter.com/apps/1041#.XX6q0i2ZOYW)

## Local Installation & Maintenance Support

If you are a third-party IT company able to provide support for installing and/or maintaining local instances of LOOK.education Visual LMS for organizations requesting and needing this software, please list your contact information below:

- [Add your IT support company - install, maintain, custom development etc.]

## 📝 License

This project is licensed under the **Polyform Noncommercial License 1.0.0 with Internal Training Exception**.

- You **may use** this software for educational, personal, or internal training purposes.
- **Commercial use**, redistribution, or monetization of this software is **not allowed**.
- See [LICENSE](./LICENSE) for full legal terms.

![License](https://img.shields.io/badge/license-Polyform--Noncommercial-orange)

## 💖 Support This Project

This project is open-source under a custom noncommercial license.  

LOOK.education is a nonprofit initiative focused on public benefit, open-source software, and public and/or internal training tools. If you’d like to support ongoing development, documentation, or hosting, you can make a donation via PayPal:

👉 Donate via PayPal
Every contribution helps sustain our open educational tools.

💬 Note: LOOK.education is owned by a nonprofit organization registered in Indiana, USA. Your donations support our open-source work and operations but are not tax-deductible under U.S. law.

[![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://www.paypal.com/donate?hosted_button_id=CDP74NFWPVMPN)
