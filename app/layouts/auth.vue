<template>

  <div 
    class="h-screen font-inter
    grid grid-cols-1 md:grid-cols-[13fr_7fr] gap-6 px-4 md:px-8 py-8 md:py-20
    bg-cover bg-center bg-no-repeat bg-[url('~/assets/images/login-background.svg')]"
    >
    <div class="hidden md:block text-white">
      <h1 class="text-3xl font-bold">
        "Accounts receivable:<br>the heartbeat of your revenue cycle."
      </h1>
      <p class="text-md">
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
      </p>
    </div>
      <div class="ml-8">
        <slot />
      </div>
  </div>
</template>
