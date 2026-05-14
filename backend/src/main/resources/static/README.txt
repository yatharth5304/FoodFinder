This directory holds frontend static files (HTML, CSS, JS).

In production, copy the contents of the /frontend/ directory here BEFORE building the JAR:

    cp -r ../../frontend/* src/main/resources/static/

Or let the Dockerfile handle it via multi-stage copy.

Spring Boot will serve these as static resources at the root URL.
