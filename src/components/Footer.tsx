import React from 'react';


const Footer = () => {
    return (
        <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 py-6 px-4 md:px-6">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center text-sm">
                {/* Left Section: Brand & Copyright */}
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">CloudSAF</span>
                    <p className="text-xs">
                        &copy; {new Date().getFullYear()} CloudSAF. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;