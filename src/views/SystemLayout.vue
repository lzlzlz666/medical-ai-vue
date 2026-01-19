<script setup>
import SideMenu from '../components/layout/SideMenu.vue'
import AIChatPanel from '../components/layout/AIChatPanel.vue'
</script>

<template>
  <div class="flex h-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-800">
    <SideMenu />

    <main class="flex-1 flex flex-col min-w-0">
      <header class="h-20 flex items-center justify-between px-8 bg-[#F8FAFC] flex-shrink-0">
        <h2 class="font-bold text-xl text-slate-800">概览</h2>
        <div class="flex items-center gap-6">
           <button class="relative text-slate-400 hover:text-slate-600 transition-colors">
             <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
             <span class="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
           </button>
           
           <button class="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100 shadow-sm active:scale-95">
             <span class="text-lg animate-pulse">🚨</span> 紧急呼救 SOS
           </button>
        </div>
      </header>
      
      <div class="flex-1 overflow-y-auto px-8 pb-8 scrollbar-hide">
        <RouterView />
      </div>
    </main>

    <AIChatPanel class="hidden xl:flex w-96 flex-shrink-0" />
  </div>
</template>

<style scoped>
/* 隐藏滚动条但保留功能 */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>