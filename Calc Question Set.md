\documentclass[11pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb,amsthm}
\usepackage{geometry}
\usepackage{tikz}
\usepackage{fancyhdr}

\geometry{left=25mm,right=25mm,top=25mm,bottom=25mm}

\pagestyle{fancy}
\fancyhf{}
\rhead{MT-1003: Calculus and Analytical Geometry}
\lhead{Practice Set }
\rfoot{Page \thepage}

\begin{document}

\begin{center}
    {\large \textbf{National University of Computer and Emerging Sciences}} \\
    {\normalsize FAST School of Computing — Chiniot-Faisalabad Campus} \\[6pt]
    {\textbf{Calculus and Analytical Geometry — Sessional Practice Set }} \\[4pt]
    \rule{\textwidth}{0.5pt}
\end{center}

\noindent \textbf{Instructions:} These questions are generated using Large Language model by Retrial Augmented generation technique by giving previous year exam questions and generating different variants of them for extensive practice.

\vspace{10pt}

\section*{Practice Questions}

\begin{enumerate}
    \item \textbf{[Curve Sketching]} Sketch or analyze the function $f(x) = \dfrac{x^2 - 4}{x}$ by finding: 
    \begin{enumerate}
        \item All critical points.
        \item Intervals for increasing and decreasing.
        \item Intervals for concave up and concave down.
        \item Relative extrema (if any).
        \item $x$-intercepts and $y$-intercept (if any).
    \end{enumerate}

    \item \textbf{[Asymptotes]} Find all vertical and horizontal asymptotes of the function $f(x) = \dfrac{5x}{x^2 - 9}$, and describe the behavior of the graph near the vertical asymptotes.

    \item \textbf{[Optimization]} A closed cylindrical container (with top and bottom) is to be constructed to hold $1000\text{ cm}^3$ of liquid. Find the dimensions ($r$ and $h$) that minimize the total surface area of the container.

    \item \textbf{[Applied Optimization / Mechanics]} The force $F$ (in pounds) needed to drag a crate along a horizontal surface is given by $F = \dfrac{\mu W}{\cos\theta + \mu\sin\theta}$, where $W$ is the weight and $\mu$ is the coefficient of friction. Suppose $W = 200\text{ lb}$ and $\mu = 0.4$. 
    \begin{enumerate}
        \item Find $\dfrac{dF}{d\theta}$ when $\theta = 45^\circ$ (express in pounds/degree).
        \item Show that $F$ is minimized when $\mu = \tan\theta$ for $0 \le \theta \le \frac{\pi}{2}$.
    \end{enumerate}

    \item \textbf{[Related Rates - Conical Tank]} 
    Water is leaking from a conical tank (vertex down) at a rate of $2\text{ ft}^3/\text{min}$. The tank has a height of $12\text{ ft}$ and a base radius of $4\text{ ft}$ (as shown in the figure below). How fast is the water level falling when the water height is $6\text{ ft}$?
    
    \begin{center}
    \begin{tikzpicture}[scale=0.8]
        % Conical Tank Diagram
        \draw[thick] (0,0) -- (2,4) -- (-2,4) -- cycle;
        \draw[thick] (0,4) ellipse (2cm and 0.5cm);
        \draw[dashed] (0,0) -- (0,4);
        \node at (0,2) [left] {$12\text{ ft}$};
        \node at (1,4) [above] {$r = 4\text{ ft}$};
        % Water level
        \draw[blue, thick] (-1,2) -- (1,2);
        \draw[blue, dashed] (0,0) -- (0,2);
        \node at (0,1) [right] {$h = 6\text{ ft}$};
    \end{tikzpicture}
    \end{center}

    \item \textbf{[Related Rates - Ladder]} A ladder $10\text{ meters}$ long rests against a vertical wall. If the bottom of the ladder slides away from the wall at a rate of $1\text{ m/s}$, how fast is the top of the ladder sliding down the wall when the bottom is $6\text{ meters}$ from the wall?

    \item \textbf{[Linear Approximation]} Find the linear approximation of $f(x) = \sqrt[3]{x}$ at $x = 8$. Use it to approximate the values of $\sqrt[3]{8.5}$ and $\sqrt[3]{7.8}$, and compare them with exact calculator values.

    \item \textbf{[Differentials]} Use linear approximation (differentials) to estimate the maximum percentage error in calculating the volume of a sphere if the radius is measured as $r = 5\text{ cm}$ with a maximum possible error of $0.1\text{ cm}$.

    \item \textbf{[Limits & L'H\^{o}pital's Rule]} Evaluate $\lim\limits_{x \to 0} (\cos x)^{1/x^2}$.

    \item \textbf{[Limits & L'H\^{o}pital's Rule]} Evaluate $\lim\limits_{x \to 1} \left(\frac{x}{x-1} - \frac{1}{\ln x}\right)$.

    \item \textbf{[Limits - Exponential Form]} Evaluate $\lim\limits_{x \to 0^+} (1 + 2\sin x)^{3/x}$.

    \item \textbf{[Continuity & Discontinuity]} Determine the points of discontinuity for the function $f(x) = \dfrac{x^2 - x - 2}{x - 2}$. Identify the type of discontinuity, and if it is removable, find the continuous extension function.

    \item \textbf{[Piecewise Function Continuity]} Find the values of constants $a$ and $b$ that make the following piecewise function continuous everywhere:
    $$f(x) = \begin{cases} 
    ax^2 + b, & x < 1 \\ 
    2, & x = 1 \\ 
    \dfrac{x^2 - 1}{x - 1}, & x > 1 
    \end{cases}$$

    \item \textbf{[Advanced Curve Sketching]} Find the vertical and horizontal asymptotes, critical points, and sketch the graph of $f(x) = \dfrac{8x}{x^2 - 4}$.

    \item \textbf{[Optimization - Area/Volume]} A rectangle is to be inscribed in a semicircle of radius $R = 5\text{ cm}$ with one side lying along the diameter. Find the dimensions of the rectangle with maximum area.

\end{enumerate}

\section*{Advanced Practice Questions}

\begin{enumerate}
    \item \textbf{[Slant Asymptotes \& Curve Sketching]} Consider the rational function $f(x) = \dfrac{x^2 - 2x - 3}{x - 1}$. 
    \begin{enumerate}
        \item Find all vertical, horizontal, or slant (oblique) asymptotes.
        \item Find the critical points and intervals of increase/decrease.
        \item Sketch the overall graph behavior.
    \end{enumerate}
    \item \textbf{[Cubic Rational Asymptotes]} Find all vertical and slant asymptotes for the cubic rational function $f(x) = \dfrac{x^3 + 1}{x^2 - 4}$, and identify any local extrema.
    \item \textbf{[Box Folding Optimization]} A rectangular sheet of metal measuring $20\text{ cm}$ by $12\text{ cm}$ is to be fashioned into an open-topped box by cutting equal square patches of side length $x$ from each of the four corners and folding up the flaps. Find the optimal value of $x$ that maximizes the total volume of the box.
    \item \textbf{[Capsule Optimization]} A cylindrical storage container with hemispherical ends (resembling a pill capsule) has a fixed total surface area of $S = 400\pi\text{ cm}^2$. Find the radius $r$ of the hemispherical ends and the length $L$ of the cylindrical midsection that maximize the total volume of the container.
    \item \textbf{[Modified Friction Force Optimization]} The dragging force is given by $F = \dfrac{\mu W}{\cos\theta + \mu\sin\theta}$[cite: 8]. Suppose $W = 300\text{ lb}$ and $\mu = 0.5$. 
    \begin{enumerate}
        \item Find $\dfrac{dF}{d\theta}$ when $\theta = 60^\circ$ (in pounds/degree).
        \item Verify algebraically the optimal angle condition for minimum force.
    \end{enumerate}
    \item \textbf{[Related Rates - Sand Pile]} Dry sand is pouring from a chute at a constant rate of $12\text{ ft}^3/\text{min}$, forming a conical pile on the ground whose height is always maintained at exactly twice its base radius ($h = 2r$). How fast is the height of the sand pile increasing when the pile is $8\text{ ft}$ high?
    \item \textbf{[Related Rates - Searchlight]} A lighthouse searchlight is located $30\text{ meters}$ off a straight shoreline. If the light rotates at a constant rate of $2\text{ rad/min}$, how fast is the light beam sweeping along the shoreline when it is $40\text{ meters}$ away from the point closest to the lighthouse?
    \item \textbf{[Linear Approximation]} Find the linear approximation of $g(x) = \sqrt{x^2 + 9}$ at $x = 4$. Use it to approximate the value of $\sqrt{(4.05)^2 + 9}$, and compare your approximation with the exact calculator value.
    \item \textbf{[Percentage Error Differentials]} The edge length of a cube is measured to be $10\text{ cm}$ with a maximum possible measurement error of $0.05\text{ cm}$. Use differentials to estimate the maximum percentage error in calculating the total surface area and the volume of the cube.
    \item \textbf{[Advanced Limits - Trig Form]} Evaluate $\lim\limits_{x \to 0} \left(\frac{1}{\sin x} - \frac{1}{x}\right)$.
    \item \textbf{[Advanced Limits - Exponential Form]} Evaluate $\lim\limits_{x \to 0^+} (\tan x)^x$.
    \item \textbf{[Algebraic Indeterminate Limits]} Evaluate $\lim\limits_{x \to 1} \frac{x^3 - 3x + 2}{x^3 - x^2 - x + 1}$.
    \item \textbf{[Complex Piecewise Continuity]} Find the values of constants $a$ and $b$ that make the piecewise function $f(x)$ continuous across its entire domain:
    $$f(x) = \begin{cases} 
    ax + b, & x < -1 \\ 
    3x^2, & -1 \le x \le 2 \\ 
    ax - b + 6, & x > 2 
    \end{cases}$$
    \item \textbf{[Discontinuity Analysis]} Analyze the continuity of the function $f(x) = \begin{cases} \frac{\sin(3x)}{x}, & x \neq 0 \\ 5, & x = 0 \end{cases}$. Identify the type of discontinuity at $x = 0$ and state the continuous extension function if it is removable.
    \item \textbf{[Removable Discontinuity Extension]} Given the function $f(x) = \dfrac{x^3 - 8}{x - 2}$ for $x \neq 2$, find the value of $f(2)$ that removes the discontinuity at $x = 2$, and write the fully simplified continuous extension formula.
\end{enumerate}
\section*{25 Optimization Practice Questions}
\begin{enumerate}
    \item \textbf{[Basic Area/Perimeter]} Find the dimensions of a rectangle with a fixed perimeter of $100\text{ meters}$ that yield the maximum possible area.
    \item \textbf{[Box Folding Variant]} A rectangular sheet of cardboard measuring $16\text{ cm}$ by $10\text{ cm}$ is to be made into an open box by cutting equal squares of side $x$ from each corner and folding up the sides. Find the value of $x$ that maximizes the volume.
    \item \textbf{[Open Cylindrical Container]} A cylindrical container with an open top is designed to hold $500\text{ cm}^3$ of liquid. Find the radius $r$ and height $h$ that minimize the total surface area used.
    \item \textbf{[Closed Cylindrical Container]} A closed cylindrical can is to hold $1\text{ liter}$ ($1000\text{ cm}^3$) of oil. Find the dimensions ($r$ and $h$) that minimize the total surface area.
    \item \textbf{[Fencing Along a River]} A farmer has $400\text{ meters}$ of fencing to enclose a rectangular pasture along a straight river. If no fencing is required along the river, find the dimensions that maximize the enclosed area.
    \item \textbf{[Poster Margins]} A rectangular poster is to contain $50\text{ in}^2$ of picture area, with a $4$-inch margin at the top and bottom and a $2$-inch margin on each side. Find the overall dimensions of the poster that minimize the total paper area.
    \item \textbf{[Distance to a Curve]} Find the point on the parabola $y = x^2$ that is closest to the point $(0, 3)$.
    \item \textbf{[Mechanics - Friction Force]} The force $F$ required to drag a crate of weight $W$ along a horizontal surface is given by $F = \dfrac{\mu W}{\cos\theta + \mu\sin\theta}$, where $\mu$ is the coefficient of friction[cite: 8]. Given $W = 250\text{ lb}$ and $\mu = 0.4$, find the angle $\theta$ ($0 \le \theta \le \frac{\pi}{2}$) that minimizes the force $F$.
    \item \textbf{[Semicircular Window Frame]} A Norman window is constructed by cementing a semicircle on top of a rectangular window. If the total perimeter of the frame is fixed at $24\text{ feet}$, find the dimensions $r$ and $h$ that maximize the total area of the window.
    \item \textbf{[Inscribed Rectangle in Semicircle]} A rectangle is inscribed inside a semicircle of radius $R = 6\text{ cm}$ with one side lying along the diameter. Find the dimensions that maximize the area of the rectangle.
    \item \textbf{[Inscribed Rectangle in Right Triangle]} A rectangle is inscribed in a right-angled triangle with base $10\text{ cm}$ and height $5\text{ cm}$, such that one corner of the rectangle lies on the hypotenuse. Maximize the area of this rectangle.
    \item \textbf{[Pipeline Construction Cost]} A oil refinery is located on the north bank of a straight river $2\text{ miles}$ wide. A storage tank is located on the south bank, $6\text{ miles}$ east of the refinery. Cost to lay pipe underwater is $\$5000/\text{mile}$ and on land is $\$3000/\text{mile}$. Where should the pipe land on the south bank to minimize total cost?
    \item \textbf{[Minimizing Travel Time]} A runner is at a point $A$ on the bank of a straight river $3\text{ km}$ wide. She wants to reach point $B$, which is $5\text{ km}$ downstream on the opposite bank. She can run at $5\text{ km/h}$ and swim at $3\text{ km/h}$. Find the landing point that minimizes total travel time.
    \item \textbf{[Cone Inscribed in Sphere]} Find the height and base radius of the right circular cone of maximum volume that can be inscribed in a sphere of radius $R = 9\text{ cm}$.
    \item \textbf{[Cylinder Inscribed in Sphere]} Find the radius and height of the right circular cylinder of maximum volume that can be inscribed in a sphere of radius $R = 6\text{ cm}$.
    \item \textbf{[Cylinder Inscribed in Cone]} A right circular cylinder is inscribed inside a cone of height $12\text{ cm}$ and base radius $4\text{ cm}$. Find the dimensions of the cylinder that maximize its volume.
    \item \textbf{[Minimizing Ladder Length]} A fence $8\text{ meters}$ high is located $1\text{ meter}$ away from a tall building. Find the length of the shortest ladder that can reach from the ground outside the fence to the wall of the building.
    \item \textbf{[Trapezoidal Trough]} A sheet of metal $30\text{ cm}$ wide is bent along two lines parallel to the edges to form a trough with a trapezoidal cross-section (base and sides of length $10\text{ cm}$). Find the angle of inclination $\theta$ that maximizes the cross-sectional area.
    \item \textbf{[Product Maximization with Constraints]} Find two positive numbers whose sum is $60$ and whose product of the square of the first and the cube of the second is a maximum.
    \item \textbf{[Minimizing Sum of Squares]} Find two numbers whose sum is $40$ such that the sum of their squares is minimized.
    \item \textbf{[Ellipse Optimization]} Find the area of the largest rectangle that can be inscribed in the ellipse $\dfrac{x^2}{16} + \dfrac{y^2}{9} = 1$.
    \item \textbf{[Postal Regulations Box]} A postal regulation states that the sum of the length and girth (perimeter of cross-section) of a package shaped like a rectangular box with square ends cannot exceed $108\text{ inches}$. Find the dimensions of the box with square ends that maximizes its volume.
    \item \textbf{[Revenue & Demand Optimization]} A bookstore finds that at a price of $\$20$, they sell $300$ books per week. For every $\$1$ increase in price, sales drop by $10$ books. What price should they charge to maximize weekly revenue?
    \item \textbf{[Minimizing Surface Area of Pill Capsule]} A cylindrical medical capsule with hemispherical ends has a fixed volume $V = 36\pi\text{ cm}^3$. Find the radius $r$ and cylinder length $L$ that minimize the total surface area.
    \item \textbf{[Illumination Intensity]} A light source is placed above the center of a circular table of radius $3\text{ meters}$. The illumination at any point on the edge of the table is proportional to the sine of the angle of incidence and inversely proportional to the square of the distance from the source. At what height should the light be suspended to maximize illumination at the edge?
\end{enumerate}
\section*{25 Related Rates Practice Questions}
\begin{enumerate}
    \item \textbf{[Sliding Ladder]} A $10$-meter ladder rests against a vertical wall. If the bottom of the ladder slides away from the wall at a rate of $1.2\text{ m/s}$, how fast is the top of the ladder sliding down the wall when the bottom is $6\text{ meters}$ from the wall?
    \item \textbf{[Conical Tank - Draining]} Water is leaking from a conical tank (vertex down) at a rate of $3\text{ ft}^3/\text{min}$. The tank has a height of $12\text{ ft}$ and a base radius of $6\text{ ft}$. How fast is the water level falling when the water depth is $4\text{ ft}$?
    \item \textbf{[Conical Tank - Filling]} Water is poured into a conical container at a rate of $10\text{ cm}^3/\text{sec}$. The cone points directly down and has a height of $30\text{ cm}$ and a base radius of $10\text{ cm}$. How fast is the water level rising when the water is $9\text{ cm}$ deep?
    \item \textbf{[Streetlight Shadow]} A man $6\text{ feet}$ tall walks away from a streetlight pole $15\text{ feet}$ high at a speed of $5\text{ ft/s}$. How fast is the tip of his shadow moving, and how fast is the length of his shadow increasing?
    \item \textbf{[Intersecting Cars]} Car A is traveling west at $60\text{ mi/h}$ and Car B is traveling north at $80\text{ mi/h}$ toward the same intersection. At a given instant, Car A is $3\text{ miles}$ and Car B is $4\text{ miles}$ away from the intersection. At what rate is the distance between the two cars changing?
    \item \textbf{[Expanding Oil Slick]} An oil spill spreads in a circular pattern whose radius increases at a constant rate of $2\text{ ft/min}$. How fast is the area of the oil slick increasing when the radius reaches $20\text{ ft}$?
    \item \textbf{[Spherical Balloon]} Air is pumped into a spherical balloon at a rate of $500\text{ cm}^3/\text{min}$. How fast is the radius of the balloon increasing when the radius is $10\text{ cm}$?
    \item \textbf{[Spherical Balloon Surface Area]} A spherical balloon is deflating at a rate of $30\text{ cm}^3/\text{sec}$. How fast is its surface area decreasing when the radius is $5\text{ cm}$?
    \item \textbf{[Rotating Searchlight]} A lighthouse is located $4\text{ km}$ off a straight shoreline. Its searchlight rotates at $3\text{ rev/min}$ ($6\pi\text{ rad/min}$). How fast is the light beam moving along the shoreline at a point $3\text{ km}$ down the shore from the closest point?
    \item \textbf{[Rocket Launch Tracking]} A rocket is launched vertically and is tracked from a radar station located on the ground $5\text{ miles}$ away from the launch pad. When the rocket is $12\text{ miles}$ high and rising at a speed of $4\text{ mi/s}$, how fast is the distance between the radar station and the rocket increasing?
    \item \textbf{[Angle of Elevation Rate]} A camera is positioned $30\text{ meters}$ from the base of a launching platform. A model rocket is shot straight up at $10\text{ m/s}$. How fast is the camera's angle of elevation changing when the rocket is $40\text{ meters}$ up?
    \item \textbf{[Sand Pile Formation]} Dry sand pours from a conveyor belt at $10\text{ m}^3/\text{min}$, forming a conical pile whose base diameter is always equal to three times its height. How fast is the height of the pile increasing when the height is $4\text{ meters}$?
    \item \textbf{[Piston Movement]} In an engine, a connecting rod is $12\text{ inches}$ long, attached to a crank of radius $4\text{ inches}$ rotating at $200\text{ rad/min}$. Find the linear velocity of the piston when the crank angle is $90^\circ$.
    \item \textbf{[Pyramid Water Reservoir]} A water trough is $10\text{ meters}$ long, and its cross-section is an isosceles triangle with a top width of $4\text{ meters}$ and a height of $3\text{ meters}$. Water is being pumped in at $2\text{ m}^3/\text{min}$. How fast is the water level rising when the depth is $1.5\text{ meters}$?
    \item \textbf{[Particle on Parabola]} A particle moves along the curve $y = \sqrt{x}$. As it passes through the point $(4, 2)$, its $y$-coordinate is increasing at a rate of $3\text{ cm/s}$. How fast is its $x$-coordinate changing at that instant?
    \item \textbf{[Diagonal of a Rectangle]} The length of a rectangle is increasing at a rate of $3\text{ cm/s}$ and its width is decreasing at a rate of $2\text{ cm/s}$. When the length is $10\text{ cm}$ and width is $5\text{ cm}$, how fast is the length of the diagonal changing?
    \item \textbf{[Inverted Pyramidal Tank]} Water flows into an inverted square pyramidal tank at $5\text{ m}^3/\text{min}$. The base of the pyramid is a square of side $6\text{ meters}$ and the height is $12\text{ meters}$. How fast is the water level rising when the depth is $4\text{ meters}$?
    \item \textbf{[Boat on a Winch]} A boat is pulled toward a dock by a rope attached to the bow through a pulley located $5\text{ feet}$ above the bow. If the rope is hauled in at a rate of $2\text{ ft/s}$, how fast is the boat approaching the dock when the rope is $13\text{ feet}$ long?
    \item \textbf{[Shadow of a Ball Dropped]} A ball is dropped from a height of $60\text{ feet}$ directly above a point $20\text{ feet}$ away from a light source on the ground. The height of the ball at time $t$ seconds is $h = 60 - 16t^2$. How fast is the length of the shadow on the ground changing when $t = 1\text{ second}$?
    \item \textbf{[Circular Ripples]} A pebble dropped into a calm pond causes concentric circular ripples. The outer ripple radius increases at $1\text{ ft/s}$. How fast is the total area enclosed between the first and second ripples ($r_2 - r_1 = 2\text{ ft}$) changing?
    \item \textbf{[Cylinder Expansion]} The radius of a right circular cylinder is increasing at $2\text{ cm/min}$ while its height is decreasing at $3\text{ cm/min}$. How fast is the volume changing when radius is $5\text{ cm}$ and height is $10\text{ cm}$?
    \item \textbf{[Two Ships Sailing Apart]} Ship A sails east from a port at $20\text{ knots}$ and Ship B sails south from the same port at $15\text{ knots}$, starting at the same time. How fast is the distance between them increasing after $2\text{ hours}$?
    \item \textbf{[Ladder Slumping Against Corner]} A beam of length $13\text{ meters}$ slides down between a vertical wall and a horizontal floor. If the top slides down at $0.5\text{ m/s}$, how fast is the midpoint of the beam moving away from the corner when the base is $5\text{ meters}$ from the wall?
    \item \textbf{[Parabolic Bowl Draining]} Liquid drains from a parabolic bowl $y = x^2$ at $2\text{ cm}^3/\text{sec}$. How fast is the liquid level dropping when the depth is $4\text{ cm}$?
    \item \textbf{[Airplane Flying Overhead]} An airplane flies horizontally at an altitude of $6\text{ miles}$ and a speed of $500\text{ mi/h}$ directly over a radar station. How fast is the distance between the airplane and the radar station increasing $1\text{ minute}$ after it passes overhead?
\end{enumerate}
\section*{25 Limits, L'Hôpital's Rule & Continuity Practice Questions}
\begin{enumerate}
    \item \textbf{[Algebraic Limit]} Evaluate $\lim\limits_{x \to 3} \dfrac{x^2 - 9}{x - 3}$.
    \item \textbf{[Rationalizing Limit]} Evaluate $\lim\limits_{x \to 0} \dfrac{\sqrt{x + 4} - 2}{x}$.
    \item \textbf{[Trigonometric Limit]} Evaluate $\lim\limits_{x \to 0} \dfrac{\sin(5x)}{\sin(3x)}$.
    \item \textbf{[Trigonometric Limit]} Evaluate $\lim\limits_{x \to 0} \dfrac{1 - \cos x}{x^2}$.
    \item \textbf{[Infinity Limit]} Evaluate $\lim\limits_{x \to \infty} \dfrac{3x^2 - 5x + 2}{4x^2 + x - 7}$.
    \item \textbf{[L'Hôpital's Rule - 0/0]} Evaluate $\lim\limits_{x \to 0} \dfrac{e^x - 1 - x}{x^2}$.
    \item \textbf{[L'Hôpital's Rule - $\infty/\infty$]} Evaluate $\lim\limits_{x \to \infty} \dfrac{\ln x}{x^3}$.
    \item \textbf{[L'Hôpital's Rule - Product Form]} Evaluate $\lim\limits_{x \to 0^+} x \ln x$.
    \item \textbf{[L'Hôpital's Rule - Difference Form]} Evaluate $\lim\limits_{x \to 1} \left(\frac{1}{\ln x} - \frac{1}{x - 1}\right)$.
    \item \textbf{[Exponential Form Limit]} Evaluate $\lim\limits_{x \to 0} (1 + 3x)^{2/x}$.
    \item \textbf{[Exponential Form Limit]} Evaluate $\lim\limits_{x \to 0^+} (\sin x)^x$.
    \item \textbf{[Indeterminate Power Limit]} Evaluate $\lim\limits_{x \to \infty} \left(1 + \frac{2}{x}\right)^x$.
    \item \textbf{[Complex L'Hôpital Form]} Evaluate $\lim\limits_{x \to 0} \dfrac{x - \arctan x}{x^3}$.
    \item \textbf{[Trig Exponential Form]} Evaluate $\lim\limits_{x \to 0} (\cos x)^{1/x^2}$.
    \item \textbf{[Polynomial Rational Limit]} Evaluate $\lim\limits_{x \to 1} \dfrac{x^3 - 3x + 2}{x^3 - x^2 - x + 1}$.
    \item \textbf{[Continuity Classification]} Determine the points of discontinuity for $f(x) = \dfrac{x^2 - 4}{x - 2}$ and identify the type of discontinuity.
    \item \textbf{[Continuous Extension]} Find the continuous extension function for $f(x) = \dfrac{\sin(4x)}{x}$ at $x = 0$.
    \item \textbf{[Piecewise Continuity Constants]} Find values of $a$ and $b$ that make $f(x) = \begin{cases} ax^2 + b, & x < 2 \\ 5, & x = 2 \\ 2x - a + b, & x > 2 \end{cases}$ continuous everywhere.
    \item \textbf{[Complex Piecewise Continuity]} Find values of $a$ and $b$ making $f(x) = \begin{cases} \dfrac{x^2 - 1}{x - 1}, & x < 1 \\ ax^2 + bx + 3, & 1 \le x \le 3 \\ 2x - a - b, & x > 3 \end{cases}$ continuous on its domain.
    \item \textbf{[Greatest Integer Function Limit]} Evaluate $\lim\limits_{x \to 2^-} \lfloor x \rfloor$ and $\lim\limits_{x \to 2^+} \lfloor x \rfloor$, and discuss continuity at $x = 2$.
    \item \textbf{[Squeeze Theorem Application]} Evaluate $\lim\limits_{x \to 0} x^2 \sin\left(\frac{1}{x}\right)$ using the Squeeze Theorem.
    \item \textbf{[One-Sided Limits]} Evaluate $\lim\limits_{x \to 3^-} \dfrac{|x - 3|}{x - 3}$ and $\lim\limits_{x \to 3^+} \dfrac{|x - 3|}{x - 3}$.
    \item \textbf{[Intermediate Value Theorem]} Show that the equation $x^3 - 4x + 1 = 0$ has at least one real root in the interval $[0, 1]$.
    \item \textbf{[Asymptotic Limit]} Find $\lim\limits_{x \to \infty} \left(\sqrt{x^2 + 4x} - x\right)$.
    \item \textbf{[Advanced Limit Form]} Evaluate $\lim\limits_{x \to 0} \dfrac{x \cos x - \sin x}{x^3}$.
\end{enumerate}
\section*{25 Derivatives \& Applications Practice Questions}
\begin{enumerate}
    \item \textbf{[Implicit Differentiation]} Find $\dfrac{dy}{dx}$ for the implicit curve $x^3 + y^3 = 6xy$.
    \item \textbf{[Higher-Order Derivative]} Find the fourth derivative $f^{(4)}(x)$ of $f(x) = x^4 - 5x^3 + 2x^2 - x + 7$.
    \item \textbf{[Tangent Line Equation]} Find the equation of the tangent line to the curve $y = \dfrac{\sqrt{x}}{1 + x^2}$ at the point $\left(1, \frac{1}{2}\right)$.
    \item \textbf{[Friction Force Derivative Rate]} The force $F$ (in pounds) needed to drag a crate is given by $F = \dfrac{\mu W}{\cos\theta + \mu\sin\theta}$[cite: 8]. Given $W = 150\text{ lb}$ and $\mu = 0.3$, find $\dfrac{dF}{d\theta}$ when $\theta = 30^\circ$[cite: 8].
    \item \textbf{[Linear Approximation]} Find the linear approximation of $g(z) = 4\sqrt{z}$ at $z = 2$, and use it to approximate $\sqrt[7]{3}$ and $\sqrt[4]{10}$[cite: 5].
    \item \textbf{[Linear Approximation Square Root]} Find the linear approximation of $f(x) = \sqrt{x}$ at $x = 100$, and use it to estimate $\sqrt{103}$.
    \item \textbf{[Differentials / Percentage Error]} The side length of a cube is measured as $x = 5\text{ cm}$ with a maximum error of $0.02\text{ cm}$. Use differentials to estimate the maximum percentage error in calculating its volume.
    \item \textbf{[Mean Value Theorem]} Verify the Mean Value Theorem for $f(x) = x^3 - x$ on the interval $[0, 2]$, and find all values of $c$ in $(0, 2)$ that satisfy the conclusion.
    \item \textbf{[Rolle's Theorem]} Verify Rolle's Theorem for $f(x) = x^2 - 4x + 3$ on the interval $[1, 3]$, and find the exact value of $c$.
    \item \textbf{[Critical Points]} Find all critical numbers of the function $f(x) = x^{4/3} - 4x^{1/3}$.
    \item \textbf{[Increasing / Decreasing Intervals]} Find the intervals on which $f(x) = x^3 - 3x^2 - 9x + 5$ is increasing and decreasing.
    \item \textbf{[First Derivative Test]} Find all relative extrema of $f(x) = x^3 - 12x + 1$ using the First Derivative Test.
    \item \textbf{[Concavity Intervals]} Determine the intervals of concavity and inflection points for $f(x) = 3x^4 - 4x^3 + 1$.
    \item \textbf{[Second Derivative Test]} Use the Second Derivative Test to classify the critical points of $f(x) = 2x^3 - 6x^2 + 3$.
    \item \textbf{[Curve Sketching - Rational]} Analyze and sketch $f(x) = \dfrac{x^2 + 1}{x}$ by finding critical points, monotonicity, concavity, extrema, and intercepts[cite: 2].
    \item \textbf{[Logarithmic Differentiation]} Find $\dfrac{dy}{dx}$ for $y = x^{\sin x}$ using logarithmic differentiation.
    \item \textbf{[Parametric Derivative]} Find $\dfrac{dy}{dx}$ and $\dfrac{d^2y}{dx^2}$ for the parametric curve given by $x = t^2 - 3t$ and $y = t^3 - t$.
    \item \textbf{[Rate of Change with Chain Rule]} Given $y = u^3 + 2u$ and $u = \sin x$, find $\dfrac{dy}{dx}$ at $x = \frac{\pi}{6}$.
    \item \textbf{[Derivative of Inverse Function]} Let $f(x) = x^3 + 2x + 1$. Find $(f^{-1})'(4)$ without explicitly finding $f^{-1}(x)$.
    \item \textbf{[Slant Asymptote via Derivatives]} Find the slant asymptote and test for monotonicity of $f(x) = \dfrac{x^2 - 2x - 3}{x - 1}$.
    \item \textbf{[Orthogonal Trajectories]} Show that the family of curves $y = kx^2$ is orthogonal to the family $x^2 + 2y^2 = c$.
    \item \textbf{[Extreme Value Theorem]} Find the absolute maximum and minimum values of $f(x) = 3x^4 - 4x^3$ on the closed interval $[-1, 2]$.
    \item \textbf{[Derivative Word Problem]} The position of a particle is given by $s(t) = t^3 - 6t^2 + 9t$. Find the times when the particle is at rest and its total distance traveled during the first $5\text{ seconds}$.
    \item \textbf{[Rate of Change of Friction Angle]} Show algebraically that $F$ is minimized when $\mu = \tan\theta$[cite: 8, 10].
    \item \textbf{[Implicit Higher Derivative]} Find $\dfrac{d^2y}{dx^2}$ for the circle $x^2 + y^2 = 25$ at the point $(3, 4)$.
\end{enumerate}
\section*{25 Tricky \& Trap Derivative Questions}
\begin{enumerate}
    \item \textbf{[Critical Point Trap 1]} Find all critical numbers of the function $f(x) = |x^2 - 4|$. \textit{Hint: Do not just set the derivative to zero.}
    \item \textbf{[Critical Point Trap 2]} Find all critical numbers of $f(x) = x^{2/3}(x - 5)$.
    \item \textbf{[Rolle's Theorem Trap]} Can Rolle's Theorem be applied to $f(x) = 1 - x^{2/3}$ on the interval $[-1, 1]$? Justify your answer.
    \item \textbf{[Mean Value Theorem Trap]} Does the Mean Value Theorem apply to $f(x) = \dfrac{1}{x}$ on the interval $[-1, 1]$? Why or why not?
    \item \textbf{[Inflection Point Trap]} True or False: If $f''(c) = 0$, then $(c, f(c))$ must be an inflection point of the graph of $f$. Test your logic on $f(x) = x^4$.
    \item \textbf{[Second Derivative Test Failure]} Consider $f(x) = x^6$. Find its critical point at $x = 0$ and attempt to classify it using the Second Derivative Test. What happens?
    \item \textbf{[Absolute Extrema Trap on Open Intervals]} Find the absolute maximum and minimum values of $f(x) = \dfrac{1}{x}$ on the open interval $(0, 1)$.
    \item \textbf{[L'Hôpital's Rule False Application]} A student evaluates $\lim\limits_{x \to 0} \dfrac{x^2 + 2x + 1}{x + 3}$ by taking derivatives of numerator and denominator to get $\lim\limits_{x \to 0} \dfrac{2x + 2}{1} = 2$. Explain the mathematical trap here.
    \item \textbf{[Derivative of Absolute Value at Zero]} Evaluate $\dfrac{d}{dx}(x|x|)$ at $x = 0$ using the limit definition of the derivative.
    \item \textbf{[Tangent Line Non-Existence]} Find the equation of the line tangent to $f(x) = |x|$ at $x = 0$.
    \item \textbf{[Concavity vs. Increasing Derivative]} If a function $f(x)$ is strictly increasing on an interval, does its derivative $f'(x)$ have to be strictly increasing? Test with $f(x) = x^3$.
    \item \textbf{[Vertical Tangent Trap]} Find the slope of the tangent line to $f(x) = x^{1/3}$ at $x = 0$. What does this imply about the derivative?
    \item \textbf{[Optimization Domain Trap]} A cylindrical soda can is to hold $355\text{ cm}^3$ of liquid. If the top and bottom metal is twice as thick per unit area as the side wall, set up the objective function and state its valid physical domain.
    \item \textbf{[Linear Approximation Over/Underestimation]} For $f(x) = \sqrt{x}$ at $a = 100$, does the linear approximation overestimate or underestimate the value of $\sqrt{103}$? Use concavity to explain.
    \item \textbf{[Related Rates Angle Trap]} A ladder $10\text{ meters}$ long slides down a wall. Let $\theta$ be the angle between the ladder and the ground. If the bottom slides away at $1\text{ m/s}$, is the rate of change of $\theta$ constant?
    \item \textbf{[Implicit Differentiation Domain Trap]} Find $\dfrac{dy}{dx}$ for $x^2 + y^2 = 25$ at the point $(5, 0)$. Explain why the resulting slope expression yields a division by zero.
    \item \textbf{[Saddle Point vs. Local Extrema]} Find all critical points of $f(x) = x^3$. Is $x = 0$ a local extremum? Classify it.
    \item \textbf{[Cusps and Extreme Values]} Can a function possess a relative extremum at a point where its derivative is undefined? Give an example.
    \item \textbf{[Friction Force Physical Domain]} In the dragging force equation $F = \dfrac{\mu W}{\cos\theta + \mu\sin\theta}$, what is the strict physical domain of $\theta$ in practical mechanics[cite: 8]?
    \item \textbf{[MVT Derivative Limit Trap]} Suppose $f$ is continuous on $[0, 3]$ and differentiable on $(0, 3)$, with $f(0) = 5$ and $f'(x) \le 2$ for all $x$. What is the maximum possible value of $f(3)$?
    \item \textbf{[Asymptote vs. Limit Trap]} Can a function intersect its own horizontal asymptote? Give an example using $f(x) = \dfrac{\sin x}{x}$.
    \item \textbf{[Increasing Function with Zero Derivative]} Is $f(x) = x^3$ strictly increasing on $(-\infty, \infty)$ even though $f'(0) = 0$? Explain why a single point with zero derivative does not break strict monotonicity.
    \item \textbf{[Extreme Value Theorem Prerequisite Trap]} Can the Extreme Value Theorem guarantee an absolute maximum and minimum for $f(x) = \dfrac{1}{x-2}$ on $[1, 3]$? Why?
    \item \textbf{[Critical Number vs. Domain Boundary]} If $f(x) = \sqrt{9 - x^2}$, find its critical numbers. Are endpoints included as critical numbers in standard calculus definitions?
    \item \textbf{[Second Derivative Sign Trap]} If $f''(x) > 0$ on an interval $(a, b)$, does that guarantee the function is positive ($f(x) > 0$) on that interval? Provide a counterexample.
\end{enumerate}
\end{document}